-- =============================================================================
-- 0026_autoria.sql
-- `created_by` y `updated_by` los pone la base (F4).
--
-- Hasta aquí las columnas existían en toda tabla de negocio y nadie las
-- llenaba. Si las llenara el panel, una petición directa a PostgREST podría
-- mandar el id de otra persona. Con este trigger, el autor es siempre el del
-- JWT con el que llega la petición.
--
-- Sin sesión (migraciones, cron, service_role) `auth.uid()` es null y se
-- respeta lo que venga: esas escrituras no las hace una persona.
-- =============================================================================

create or replace function app.sellar_autoria()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_autor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(v_autor, new.created_by);
    new.updated_by := coalesce(v_autor, new.updated_by);
  else
    new.created_by := old.created_by;
    new.updated_by := coalesce(v_autor, old.updated_by);
  end if;
  return new;
end;
$$;

comment on function app.sellar_autoria() is
  'Trigger BEFORE INSERT/UPDATE: created_by y updated_by salen del JWT, no de la petición.';

-- Se aplica a TODA tabla base de `public` que tenga las dos columnas, para
-- que ninguna se quede fuera por olvido. La prueba 0026 recorre la misma
-- lista y falla si una tabla nueva llega sin trigger.
do $$
declare
  v_tabla text;
begin
  for v_tabla in
    select c.table_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name
     where c.table_schema = 'public'
       and t.table_type = 'BASE TABLE'
       and c.column_name = 'created_by'
       and exists (select 1 from information_schema.columns u
                    where u.table_schema = 'public' and u.table_name = c.table_name
                      and u.column_name = 'updated_by')
  loop
    execute format(
      'create trigger %I before insert or update on public.%I
         for each row execute function app.sellar_autoria()',
      v_tabla || '_sellar_autoria', v_tabla
    );
  end loop;
end;
$$;
