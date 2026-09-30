-- =============================================================================
-- 0040_avisos_por_correo.sql
-- Qué alertas ya salieron por correo (F5, tarea 8).
--
-- El resumen diario manda las que tengan `enviada_en` vacío y las marca. Lo
-- hace el servidor con la service_role (sin sesión: lo dispara el cron), así
-- que ninguna persona necesita escribir esta columna.
--
-- Se protege con un trigger y no con un `revoke update (enviada_en)`: en
-- `public`, `authenticated` tiene UPDATE sobre la tabla entera, y un privilegio
-- de tabla anula el `revoke` de una columna. Quitar el de tabla obligaría a
-- volver a conceder columna por columna lo que el panel sí escribe, y cambiaría
-- el error que la prueba 0032 espera de la RLS.
-- =============================================================================
alter table public.notificaciones add column enviada_en timestamptz;
comment on column public.notificaciones.enviada_en is
  'Cuándo salió en el resumen por correo. Null si todavía no. Solo la escribe el servidor.';

create index idx_notificaciones_por_enviar on public.notificaciones (created_at)
  where enviada_en is null and resuelta_en is null;

-- Sin `security definer`: tiene que ver el rol de quien llama.
create or replace function app.proteger_enviada_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.enviada_en is distinct from old.enviada_en and current_user in ('authenticated', 'anon') then
    raise exception 'Solo el servidor marca un aviso como enviado.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger notificaciones_proteger_enviada_en
  before update of enviada_en on public.notificaciones
  for each row execute function app.proteger_enviada_en();
