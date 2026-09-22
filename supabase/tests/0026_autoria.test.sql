-- Verifica la autoría sellada por la base (0026).
--
-- Lo que se defiende: que quien crea o edita una fila quede registrado sin que
-- la aplicación tenga que acordarse, y que no se pueda mentir sobre ello
-- mandando otro `created_by` en la petición.
begin;
select plan(6);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true
 where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero', activo = true
 where id = '33333333-3333-3333-3333-333333333333';

-- Toda tabla de `public` con las dos columnas lleva el trigger. Se recorren
-- todas, no una lista: una tabla nueva sin trigger tiene que hacer fallar esto.
select is(
  (select count(*)::int
     from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name = 'created_by'
      and exists (select 1 from information_schema.columns u
                   where u.table_schema = 'public' and u.table_name = c.table_name
                     and u.column_name = 'updated_by')
      and exists (select 1 from information_schema.tables t
                   where t.table_schema = 'public' and t.table_name = c.table_name
                     and t.table_type = 'BASE TABLE')
      and not exists (select 1 from pg_trigger tg
                       join pg_class cl on cl.oid = tg.tgrelid
                       join pg_namespace n on n.oid = cl.relnamespace
                      where n.nspname = 'public' and cl.relname = c.table_name
                        and tg.tgname = c.table_name || '_sellar_autoria')),
  0,
  'toda tabla con created_by y updated_by tiene su trigger de autoría'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

-- Intenta firmar como el administrador.
insert into public.faqs (pregunta, respuesta, created_by, updated_by)
values ('¿Prueba de autoría?', 'Sí.', '22222222-2222-2222-2222-222222222222',
        '22222222-2222-2222-2222-222222222222');

select is(
  (select created_by from public.faqs where pregunta = '¿Prueba de autoría?'),
  '33333333-3333-3333-3333-333333333333'::uuid,
  'created_by es quien inserta, no lo que manda la petición'
);
select is(
  (select updated_by from public.faqs where pregunta = '¿Prueba de autoría?'),
  '33333333-3333-3333-3333-333333333333'::uuid,
  'updated_by empieza siendo quien inserta'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
update public.faqs set respuesta = 'Sí, editada.', created_by = null
 where pregunta = '¿Prueba de autoría?';

select is(
  (select created_by from public.faqs where pregunta = '¿Prueba de autoría?'),
  '33333333-3333-3333-3333-333333333333'::uuid,
  'editar no cambia quién la creó, ni aunque se mande null'
);
select is(
  (select updated_by from public.faqs where pregunta = '¿Prueba de autoría?'),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'updated_by pasa a ser quien edita'
);

-- Sin sesión (una migración, el cron) se respeta lo que venga. Hay que vaciar
-- también los claims: con `reset role` a secas, `auth.uid()` seguiría leyendo
-- el `sub` del administrador y la prueba pasaría sin probar nada.
reset role;
set local request.jwt.claims = '{}';
update public.faqs set respuesta = 'Sí, desde una migración.'
 where pregunta = '¿Prueba de autoría?';
select is(
  (select updated_by from public.faqs where pregunta = '¿Prueba de autoría?'),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'sin sesión no se borra el último autor'
);

select * from finish();
rollback;
