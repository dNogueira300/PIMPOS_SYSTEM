-- =============================================================================
-- 0034_kardex_lotes.sql
-- El kárdex reparte por lotes, lleva su costo y no admite saldos negativos
-- (F5, tarea 1; decisiones 2, 3, 4 y 5 del plan 05).
--
-- Lo que cambia respecto de 0012:
--
--   1. Cada movimiento dice si ENTRA o SALE (`sentido`). Hasta aquí se deducía
--      del tipo; con `ajuste` y `anulacion` ya no se puede.
--   2. Toda entrada cae en un lote, y toda salida sale de lotes: primero el que
--      vence antes (FEFO) y, sin fecha, el más antiguo. `movimiento_lotes` dice
--      cuánto de cada lote, y `saldos_lote` lleva lo que queda en cada uno.
--   3. `saldos_lote.cantidad_base >= 0`: el negativo es imposible. Antes de
--      llegar al check, el reparto ya falla con una frase que dice cuánto hay.
--   4. Cada lote guarda su costo por unidad base. La valorización y la merma
--      en soles salen de ahí (T6).
--   5. Una anulación es el contrario exacto de un movimiento, a los mismos
--      lotes y con la misma cantidad base.
--
-- Todo en triggers, no en la aplicación: si mañana alguien inserta desde el
-- editor SQL, el reparto y el saldo quedan igual de bien.
-- =============================================================================

-- La guarda: esta migración supone un kárdex vacío (plan 05, T1 paso 1).
do $$
begin
  if exists (select 1 from public.movimientos_insumo) then
    raise exception 'Hay movimientos de insumo registrados. 0034 supone un kárdex vacío: habla con quien mantiene el sistema antes de aplicarla.';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Piezas pequeñas
-- -----------------------------------------------------------------------------
create or replace function app.formatear_cantidad(p numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  -- «FM» quita los ceros de sobra pero deja el punto en un entero: «30.».
  select rtrim(to_char(p, 'FM999999990.99'), '.');
$$;
comment on function app.formatear_cantidad(numeric) is
  'Una cantidad como la lee una persona: 12.5, 30. Para mensajes y alertas.';
grant execute on function app.formatear_cantidad(numeric) to authenticated;

create or replace function app.almacen_principal()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.almacenes where es_principal and deleted_at is null limit 1;
$$;
comment on function app.almacen_principal() is
  'El almacén principal. Default de movimientos_insumo.almacen_id: hay uno solo (plan 05, decisión 7).';
revoke execute on function app.almacen_principal() from public, anon;
grant execute on function app.almacen_principal() to authenticated;

-- -----------------------------------------------------------------------------
-- Columnas nuevas
-- -----------------------------------------------------------------------------
alter table public.movimientos_insumo
  add column sentido smallint,
  add column anula_a uuid references public.movimientos_insumo(id) on delete restrict;

-- Lo pone el trigger BEFORE INSERT, que corre antes de comprobar el not null.
alter table public.movimientos_insumo alter column sentido set not null;
alter table public.movimientos_insumo
  add constraint sentido_valido check (sentido in (-1, 1)),
  add constraint anulacion_con_original check ((tipo = 'anulacion') = (anula_a is not null)),
  -- Un ajuste o una anulación sin explicación es un número que nadie podrá
  -- justificar en el próximo conteo.
  add constraint ajuste_explicado check (
    tipo not in ('ajuste', 'anulacion') or length(btrim(coalesce(observacion, ''))) > 0
  );

-- Un ajuste de entrada puede traer precio (el inventario inicial, si se sabe).
alter table public.movimientos_insumo drop constraint campos_de_ingreso_solo_en_ingreso;
alter table public.movimientos_insumo add constraint campos_de_ingreso_solo_en_ingreso check (
  tipo = 'ingreso'
  or (proveedor_id is null and documento_tipo is null and documento_numero is null
      and costo_total is null and (precio_unitario is null or tipo = 'ajuste'))
);

create unique index idx_mov_anula_a on public.movimientos_insumo (anula_a) where anula_a is not null;

alter table public.movimientos_insumo alter column almacen_id set default app.almacen_principal();
alter table public.movimientos_insumo alter column responsable_id set default auth.uid();

comment on column public.movimientos_insumo.sentido is
  '1 entra, -1 sale. Lo pone la base, salvo en un ajuste, donde lo dice quien cuenta.';
comment on column public.movimientos_insumo.anula_a is
  'El movimiento que esta anulación deshace. Uno solo por movimiento.';

alter table public.lotes_insumo
  add column costo_unitario numeric(14,6) check (costo_unitario is null or costo_unitario >= 0),
  -- El orden de llegada. `created_at` no sirve para desempatar: dos lotes
  -- creados en la misma transacción (una boleta de varias líneas) tienen el
  -- mismo `now()`, y el FEFO entre lotes sin fecha quedaría al azar.
  add column llegada bigint generated always as identity;
comment on column public.lotes_insumo.costo_unitario is
  'Soles por unidad base, calculado del ingreso que creó el lote. Null si no se conoce.';
comment on column public.lotes_insumo.llegada is
  'Orden de llegada. Desempata el FEFO entre lotes sin fecha y decide cuál es el último costo.';

-- -----------------------------------------------------------------------------
-- movimiento_lotes y saldos_lote
-- -----------------------------------------------------------------------------
create table public.movimiento_lotes (
  movimiento_id  uuid not null references public.movimientos_insumo(id) on delete restrict,
  lote_id        uuid not null references public.lotes_insumo(id) on delete restrict,
  cantidad_base  numeric(14,4) not null check (cantidad_base > 0),
  -- El costo del lote en el momento del movimiento: el reporte de mermas dice
  -- cuánto costó lo perdido, aunque luego alguien corrija el costo del lote.
  costo_unitario numeric(14,6),
  primary key (movimiento_id, lote_id)
);
comment on table public.movimiento_lotes is
  'De qué lote sale o a qué lote entra cada movimiento. La rellena un trigger; nunca la aplicación.';
create index idx_movimiento_lotes_lote on public.movimiento_lotes (lote_id);

create table public.saldos_lote (
  lote_id        uuid primary key references public.lotes_insumo(id) on delete restrict,
  insumo_id      uuid not null references public.insumos(id) on delete restrict,
  almacen_id     uuid not null references public.almacenes(id) on delete restrict,
  cantidad_base  numeric(14,4) not null default 0 check (cantidad_base >= 0),
  actualizado_en timestamptz not null default now()
);
comment on table public.saldos_lote is
  'Lo que queda de cada lote, en la unidad base. Lo mantiene un trigger. NUNCA se edita a mano.';
create index idx_saldos_lote_fefo on public.saldos_lote (insumo_id, almacen_id) where cantidad_base > 0;

-- -----------------------------------------------------------------------------
-- BEFORE INSERT: convertir, decidir el sentido y validar el lote
--
-- Reemplaza el cuerpo de 0012 sin cambiar el nombre ni el trigger.
-- -----------------------------------------------------------------------------
create or replace function app.calcular_cantidad_base()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_original public.movimientos_insumo;
  v_lote     public.lotes_insumo;
begin
  if new.tipo = 'anulacion' then
    select * into v_original from public.movimientos_insumo where id = new.anula_a;
    if not found then
      raise exception 'No se encontró el movimiento que quieres anular.' using errcode = 'P0001';
    end if;
    if v_original.tipo = 'anulacion' then
      raise exception 'Una anulación no se puede anular. Si hace falta, registra el movimiento otra vez.'
        using errcode = 'P0001';
    end if;
    -- Todo sale del original, se mande lo que se mande. En particular la
    -- cantidad base: si la equivalencia cambió desde entonces, convertir otra
    -- vez daría otra cifra y el saldo no volvería a su sitio.
    new.insumo_id     := v_original.insumo_id;
    new.almacen_id    := v_original.almacen_id;
    new.cantidad      := v_original.cantidad;
    new.unidad_id     := v_original.unidad_id;
    new.cantidad_base := v_original.cantidad_base;
    new.lote_id       := null;
    new.sentido       := -v_original.sentido;
    return new;
  end if;

  -- Se ignora lo que venga en `cantidad_base`: lo calcula la base, siempre.
  new.cantidad_base := app.convertir_a_base(new.insumo_id, new.unidad_id, new.cantidad);

  new.sentido := case new.tipo
                   when 'ingreso' then 1
                   when 'consumo' then -1
                   when 'baja'    then -1
                   else new.sentido  -- ajuste: lo dice quien cuenta
                 end;

  if new.lote_id is not null then
    select * into v_lote from public.lotes_insumo where id = new.lote_id;
    if v_lote.insumo_id is distinct from new.insumo_id then
      raise exception 'Ese lote es de otro insumo.' using errcode = 'P0001';
    end if;
    if new.sentido = 1 and exists (select 1 from public.movimiento_lotes where lote_id = new.lote_id) then
      raise exception 'Ese lote ya tiene su ingreso. Cada ingreso crea un lote nuevo.' using errcode = 'P0001';
    end if;
  end if;

  -- Un perecible sin fecha no puede entrar en la alerta de vencimiento, que es
  -- prioridad 1 de la ficha (7.8). Vale para el ingreso y para el conteo.
  if new.sentido = 1
     and (select i.es_perecible from public.insumos i where i.id = new.insumo_id)
     and (new.lote_id is null or v_lote.fecha_vencimiento is null)
  then
    raise exception '%', format('%s vence: escribe la fecha de vencimiento de lo que entra.',
      (select i.nombre from public.insumos i where i.id = new.insumo_id))
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- AFTER INSERT: el saldo del insumo usa el sentido
-- -----------------------------------------------------------------------------
create or replace function app.actualizar_saldo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.saldos_insumo (insumo_id, almacen_id, cantidad_base, actualizado_en)
  values (new.insumo_id, new.almacen_id, new.sentido * new.cantidad_base, now())
  on conflict (insumo_id, almacen_id) do update
    set cantidad_base  = public.saldos_insumo.cantidad_base + excluded.cantidad_base,
        actualizado_en = now();
  return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- El saldo de un lote
--
-- NO se hace con `insert ... on conflict do update`: Postgres valida el CHECK
-- de la fila candidata del INSERT (lote_id, ..., p_delta) ANTES de resolver el
-- conflicto, así que una salida (p_delta negativo) contra un lote que ya
-- existe siempre choca con `cantidad_base >= 0`, aunque el valor final tras
-- sumar sea positivo. Se comprobó a mano: falla siempre, no a veces. Por eso
-- va como UPDATE primero y, si no existe la fila (el lote es nuevo), INSERT.
-- -----------------------------------------------------------------------------
create or replace function app.mover_saldo_lote(p_lote uuid, p_insumo uuid, p_almacen uuid, p_delta numeric)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.saldos_lote
     set cantidad_base  = cantidad_base + p_delta,
         actualizado_en = now()
   where lote_id = p_lote;

  if not found then
    insert into public.saldos_lote (lote_id, insumo_id, almacen_id, cantidad_base, actualizado_en)
    values (p_lote, p_insumo, p_almacen, p_delta, now());
  end if;
end;
$$;
revoke execute on function app.mover_saldo_lote(uuid, uuid, uuid, numeric) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- AFTER INSERT: el reparto por lotes
--
-- `security definer`: escribe en movimiento_lotes, saldos_lote y el costo del
-- lote, que ninguna persona escribe a mano. Quién puede insertar el movimiento
-- ya lo decidió la política de movimientos_insumo antes de llegar aquí.
-- -----------------------------------------------------------------------------
create or replace function app.repartir_en_lotes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lote       uuid;
  v_costo      numeric(14,6);
  v_restante   numeric(14,4);
  v_tomar      numeric(14,4);
  v_disponible numeric(14,4);
  v_fila       record;
  v_insumo     text;
  v_unidad     text;
begin
  -- 1. Anulación: deshace el reparto del original, lote por lote.
  if new.tipo = 'anulacion' then
    for v_fila in
      select ml.lote_id, ml.cantidad_base, ml.costo_unitario
        from public.movimiento_lotes ml
       where ml.movimiento_id = new.anula_a
    loop
      if new.sentido = -1 then
        select s.cantidad_base into v_disponible
          from public.saldos_lote s where s.lote_id = v_fila.lote_id for update;
        if coalesce(v_disponible, 0) < v_fila.cantidad_base then
          raise exception 'Ya se usó parte de lo que entró con ese movimiento, así que no se puede anular. Cuenta lo que hay y registra un ajuste.'
            using errcode = 'P0001';
        end if;
      end if;
      insert into public.movimiento_lotes (movimiento_id, lote_id, cantidad_base, costo_unitario)
      values (new.id, v_fila.lote_id, v_fila.cantidad_base, v_fila.costo_unitario);
      perform app.mover_saldo_lote(v_fila.lote_id, new.insumo_id, new.almacen_id,
                                   new.sentido * v_fila.cantidad_base);
    end loop;
    return null;
  end if;

  -- 2. Entrada: todo a un lote, nuevo si no vino uno.
  if new.sentido = 1 then
    v_lote := new.lote_id;
    if v_lote is null then
      insert into public.lotes_insumo (insumo_id) values (new.insumo_id) returning id into v_lote;
    end if;
    v_costo := case
      when new.costo_total is not null then new.costo_total / new.cantidad_base
      when new.precio_unitario is not null then new.precio_unitario * new.cantidad / new.cantidad_base
      -- Sin precio (un conteo): el último costo conocido del insumo.
      else (select l.costo_unitario from public.lotes_insumo l
             where l.insumo_id = new.insumo_id and l.costo_unitario is not null and l.id <> v_lote
             order by l.llegada desc limit 1)
    end;
    update public.lotes_insumo set costo_unitario = v_costo where id = v_lote;
    insert into public.movimiento_lotes (movimiento_id, lote_id, cantidad_base, costo_unitario)
    values (new.id, v_lote, new.cantidad_base, v_costo);
    perform app.mover_saldo_lote(v_lote, new.insumo_id, new.almacen_id, new.cantidad_base);
    return null;
  end if;

  -- 3. Salida: del lote nombrado, o por FEFO. `for update` pone en fila a
  --    quien consuma lo mismo a la vez: el segundo ve lo que dejó el primero.
  v_restante := new.cantidad_base;
  for v_fila in
    select s.lote_id, s.cantidad_base, l.costo_unitario
      from public.saldos_lote s
      join public.lotes_insumo l on l.id = s.lote_id
     where s.insumo_id = new.insumo_id
       and s.almacen_id = new.almacen_id
       and s.cantidad_base > 0
       and (new.lote_id is null or s.lote_id = new.lote_id)
     order by l.fecha_vencimiento nulls last, l.llegada
     for update of s
  loop
    exit when v_restante <= 0;
    v_tomar := least(v_restante, v_fila.cantidad_base);
    insert into public.movimiento_lotes (movimiento_id, lote_id, cantidad_base, costo_unitario)
    values (new.id, v_fila.lote_id, v_tomar, v_fila.costo_unitario);
    perform app.mover_saldo_lote(v_fila.lote_id, new.insumo_id, new.almacen_id, -v_tomar);
    v_restante := v_restante - v_tomar;
  end loop;

  if v_restante > 0 then
    select i.nombre, u.codigo into v_insumo, v_unidad
      from public.insumos i join public.unidades_medida u on u.id = i.unidad_base_id
     where i.id = new.insumo_id;
    raise exception '%', format(
      'Solo hay %s %s de %s%s. Si en el almacén hay más, falta registrar un ingreso o hacer un conteo.',
      app.formatear_cantidad(new.cantidad_base - v_restante), v_unidad, v_insumo,
      case when new.lote_id is not null then ' en ese lote' else '' end)
      using errcode = 'P0001';
  end if;

  return null;
end;
$$;
comment on function app.repartir_en_lotes() is
  'Trigger AFTER INSERT en movimientos_insumo: reparte por lotes (FEFO), guarda el costo y lleva saldos_lote.';
revoke execute on function app.repartir_en_lotes() from public, anon, authenticated;

create trigger movimientos_repartir_en_lotes
  after insert on public.movimientos_insumo
  for each row execute function app.repartir_en_lotes();

-- -----------------------------------------------------------------------------
-- La unidad base queda fija en cuanto hay historia
-- -----------------------------------------------------------------------------
create or replace function app.fijar_unidad_base()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.unidad_base_id is distinct from old.unidad_base_id
     and exists (select 1 from public.movimientos_insumo m where m.insumo_id = old.id) then
    raise exception '% ya tiene movimientos: su unidad base no se puede cambiar. Si hace falta, crea un insumo nuevo.',
      old.nombre using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger insumos_fijar_unidad_base
  before update of unidad_base_id on public.insumos
  for each row execute function app.fijar_unidad_base();

-- -----------------------------------------------------------------------------
-- El recálculo reconstruye también los lotes
-- -----------------------------------------------------------------------------
create or replace function app.recalcular_saldos()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_filas integer;
begin
  delete from public.saldos_lote;
  insert into public.saldos_lote (lote_id, insumo_id, almacen_id, cantidad_base, actualizado_en)
  select ml.lote_id, m.insumo_id, m.almacen_id, sum(m.sentido * ml.cantidad_base), now()
    from public.movimiento_lotes ml
    join public.movimientos_insumo m on m.id = ml.movimiento_id
   group by ml.lote_id, m.insumo_id, m.almacen_id;

  delete from public.saldos_insumo;
  insert into public.saldos_insumo (insumo_id, almacen_id, cantidad_base, actualizado_en)
  select m.insumo_id, m.almacen_id, sum(m.sentido * m.cantidad_base), now()
    from public.movimientos_insumo m
   group by m.insumo_id, m.almacen_id;

  get diagnostics v_filas = row_count;
  return v_filas;
end;
$$;

-- -----------------------------------------------------------------------------
-- La alerta de vencimiento mira el saldo DEL LOTE
--
-- Igual que 0015 salvo dos cosas: un lote ya gastado no avisa aunque quede
-- existencia de otros lotes, y las cantidades se escriben sin «30.».
-- -----------------------------------------------------------------------------
create or replace function app.evaluar_alertas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creadas integer := 0;
  v_dias    integer;
  v_filas   integer;
  v_hoy     text := to_char(now() at time zone 'America/Lima', 'YYYY-MM-DD');
begin
  select coalesce((valor #>> '{}')::integer, 15)
    into v_dias
    from public.configuracion_sitio
   where clave = 'dias_aviso_vencimiento';
  v_dias := coalesce(v_dias, 15);

  insert into public.notificaciones (tipo, titulo, mensaje, insumo_id, clave_unica)
  select
    'stock_bajo',
    'Queda poco ' || i.nombre,
    'Quedan ' || app.formatear_cantidad(s.cantidad_base) || ' ' || u.codigo ||
      ' de ' || i.nombre || ', y el mínimo es ' ||
      app.formatear_cantidad(i.stock_minimo) || ' ' || u.codigo || '. Conviene reponer.',
    i.id,
    'stock_bajo:' || i.id || ':' || v_hoy
  from public.saldos_insumo s
  join public.insumos i          on i.id = s.insumo_id
  join public.unidades_medida u  on u.id = i.unidad_base_id
  where i.activo
    and i.deleted_at is null
    and i.stock_minimo > 0
    and s.cantidad_base < i.stock_minimo
  on conflict (clave_unica) do nothing;
  get diagnostics v_creadas = row_count;

  insert into public.notificaciones (tipo, titulo, mensaje, insumo_id, lote_id, clave_unica)
  select
    case when l.fecha_vencimiento < current_date then 'vencido' else 'por_vencer' end,
    case when l.fecha_vencimiento < current_date
         then 'Venció ' || i.nombre
         else i.nombre || ' está por vencer' end,
    case when l.fecha_vencimiento < current_date
         then 'El lote ' || coalesce(l.codigo, 'sin código') || ' de ' || i.nombre ||
              ' venció el ' || to_char(l.fecha_vencimiento, 'DD/MM/YYYY') || '. Quedan ' ||
              app.formatear_cantidad(sl.cantidad_base) || ' ' || u.codigo || '.'
         else 'El lote ' || coalesce(l.codigo, 'sin código') || ' de ' || i.nombre ||
              ' vence el ' || to_char(l.fecha_vencimiento, 'DD/MM/YYYY') || '. Quedan ' ||
              app.formatear_cantidad(sl.cantidad_base) || ' ' || u.codigo || '.' end,
    i.id,
    l.id,
    'vencimiento:' || l.id || ':' || v_hoy
  from public.lotes_insumo l
  join public.saldos_lote sl    on sl.lote_id = l.id and sl.cantidad_base > 0
  join public.insumos i         on i.id = l.insumo_id
  join public.unidades_medida u on u.id = i.unidad_base_id
  where l.fecha_vencimiento is not null
    and l.fecha_vencimiento <= current_date + v_dias
    and i.deleted_at is null
  on conflict (clave_unica) do nothing;
  get diagnostics v_filas = row_count;

  return v_creadas + v_filas;
end;
$$;

-- -----------------------------------------------------------------------------
-- Auditoría (R9). Los saldos no se auditan (valor derivado, igual que 0012).
-- -----------------------------------------------------------------------------
select app.auditar('public.movimiento_lotes');

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.movimiento_lotes enable row level security;
alter table public.saldos_lote      enable row level security;
alter table public.movimiento_lotes force row level security;
alter table public.saldos_lote      force row level security;

create policy "insumos lee el reparto"
  on public.movimiento_lotes for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "insumos lee saldos de lote"
  on public.saldos_lote for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- Como saldos_insumo en 0012: se revoca el privilegio, no solo se omite la
-- política, para que un intento de escribir falle en voz alta.
revoke insert, update, delete on public.movimiento_lotes from anon, authenticated;
revoke insert, update, delete on public.saldos_lote      from anon, authenticated;

-- Quién registra qué (decisiones 1 y 2):
--   · ingreso y consumo: los tres roles de insumos, siempre a su propio nombre.
--   · ajuste y anulación: solo la administración.
--   · baja: solo la administración, y autorizada por quien la registra. El
--     ingeniero la PIDE (T5); nunca la registra poniendo a otro de autorizador.
drop policy "insumos registra movimientos" on public.movimientos_insumo;
create policy "insumos registra movimientos"
  on public.movimientos_insumo for insert to authenticated
  with check (
    (select app.es_rol('superadmin', 'administrador', 'ingeniero'))
    and responsable_id = (select auth.uid())
    and (tipo in ('ingreso', 'consumo') or (select app.es_rol('superadmin', 'administrador')))
    and (tipo <> 'baja' or autorizado_por = (select auth.uid()))
  );

-- Lotes: el ingeniero los crea (al registrar un ingreso con fecha); corregir
-- su fecha, código o costo es cosa de la administración; borrar, nadie.
drop policy "insumos gestiona lotes" on public.lotes_insumo;
create policy "insumos crea lotes"
  on public.lotes_insumo for insert to authenticated
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "administracion corrige lotes"
  on public.lotes_insumo for update to authenticated
  using      ((select app.es_rol('superadmin', 'administrador')))
  with check ((select app.es_rol('superadmin', 'administrador')));
revoke delete on public.lotes_insumo from anon, authenticated;
