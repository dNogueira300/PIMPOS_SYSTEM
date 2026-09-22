-- =============================================================================
-- 0028_aprobacion_con_aviso.sql
-- El flujo de aprobación de promociones, completo (doc 03 §5.3; F4, tarea 4).
--
-- 0010 ya impide que un ingeniero publique una promoción. Faltaban dos cosas
-- que el plan pedía y la base no tenía:
--
--   1. Que el administrador se entere. Un trigger crea el aviso al pasar a
--      `en_revision` y lo cierra cuando sale de ahí. No lo hace el panel: si
--      lo hiciera, una petición directa a la API enviaría a revisión sin
--      avisar a nadie.
--   2. Dónde escribir por qué se devuelve. `comentario_revision`, que solo
--      escribe la administración y que se limpia al reenviar o publicar.
-- =============================================================================

alter table public.novedades add column comentario_revision text
  check (comentario_revision is null or length(btrim(comentario_revision)) > 0);

comment on column public.novedades.comentario_revision is
  'Por qué la administración devolvió la promoción a borrador. Se limpia al reenviarla o publicarla.';

-- notificaciones: de solo insumos a insumos + revisión de promociones.
alter table public.notificaciones drop constraint notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
  check (tipo in ('stock_bajo', 'por_vencer', 'vencido', 'promocion_en_revision'));

alter table public.notificaciones
  add column novedad_id uuid references public.novedades(id) on delete cascade;

create index idx_notificaciones_novedad on public.notificaciones (novedad_id)
  where novedad_id is not null and resuelta_en is null;

-- -----------------------------------------------------------------------------
-- El comentario: quién lo escribe y cuándo se limpia
-- -----------------------------------------------------------------------------
create or replace function app.gestionar_comentario_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Publicar o reenviar significa que lo pedido ya se atendió.
  if new.estado = 'publicado'
     or (new.estado = 'en_revision' and (tg_op = 'INSERT' or old.estado is distinct from 'en_revision')) then
    new.comentario_revision := null;
  end if;

  if new.comentario_revision is not null
     and (tg_op = 'INSERT' or new.comentario_revision is distinct from old.comentario_revision)
     and not (select app.es_rol('administrador', 'superadmin')) then
    raise exception 'Solo un administrador puede devolver una promoción con comentario.';
  end if;

  return new;
end;
$$;

create trigger novedades_comentario_revision
  before insert or update on public.novedades
  for each row execute function app.gestionar_comentario_revision();

-- -----------------------------------------------------------------------------
-- El aviso
--
-- `security definer`: `notificaciones` no tiene política de INSERT (las crea
-- el sistema, no las personas), y el ingeniero que envía a revisión no debe
-- poder escribirlas a mano.
-- -----------------------------------------------------------------------------
create or replace function app.avisar_promocion_en_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.tipo <> 'promocion' then
    return null;
  end if;

  if new.estado = 'en_revision' and (tg_op = 'INSERT' or old.estado is distinct from 'en_revision') then
    insert into public.notificaciones (tipo, titulo, mensaje, novedad_id, clave_unica)
    values (
      'promocion_en_revision',
      'Promoción esperando aprobación',
      format('«%s» espera que la revises antes de publicarla.', new.titulo),
      new.id,
      -- Cada envío es un aviso distinto: una promoción devuelta y reenviada
      -- tiene que volver a avisar.
      format('promocion_en_revision:%s:%s', new.id, extract(epoch from clock_timestamp()))
    );
  elsif tg_op = 'UPDATE' and old.estado = 'en_revision' and new.estado is distinct from 'en_revision' then
    update public.notificaciones
       set resuelta_en = now()
     where novedad_id = new.id
       and tipo = 'promocion_en_revision'
       and resuelta_en is null;
  end if;

  return null;
end;
$$;

create trigger novedades_avisar_revision
  after insert or update of estado on public.novedades
  for each row execute function app.avisar_promocion_en_revision();
