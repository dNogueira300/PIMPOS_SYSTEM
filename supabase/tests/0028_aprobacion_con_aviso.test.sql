-- Verifica la aprobación con aviso (0028).
--
-- Lo que se defiende: que el administrador se entere sin depender de que una
-- pantalla se acuerde de avisar; que el aviso se cierre solo; que solo la
-- administración escriba el comentario de devolución; y que el ciclo completo
-- —enviar, devolver, reenviar, publicar— deje el rastro correcto.
begin;
select plan(12);

insert into auth.users (id, email, created_at, updated_at) values
  ('22222222-2222-2222-2222-222222222222', 'admin@pimpos.test', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'inge@pimpos.test',  now(), now());
update public.perfiles set rol = 'administrador', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.perfiles set rol = 'ingeniero',     activo = true where id = '33333333-3333-3333-3333-333333333333';

select has_column('public', 'novedades', 'comentario_revision', 'novedades tiene comentario_revision');
select has_column('public', 'notificaciones', 'novedad_id', 'notificaciones apunta a la novedad');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';

insert into public.novedades (tipo, titulo, slug, contenido, estado)
values ('promocion', 'Promo 0028', 'promo-0028', 'Dos por uno.', 'borrador');
insert into public.novedades (tipo, titulo, slug, contenido, estado)
values ('aviso', 'Aviso 0028', 'aviso-0028', 'Cerrado el lunes.', 'borrador');

update public.novedades set estado = 'en_revision' where slug = 'promo-0028';
update public.novedades set estado = 'en_revision' where slug = 'aviso-0028';

select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-0028' and n.tipo = 'promocion_en_revision' and n.resuelta_en is null),
  1, 'enviar una promoción a revisión crea un aviso abierto'
);
select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id where v.slug = 'aviso-0028'),
  0, 'un aviso que no es promoción no genera aviso de revisión'
);

select throws_ok(
  $$ update public.novedades set comentario_revision = 'Me apruebo solo' where slug = 'promo-0028' $$,
  'P0001', 'Solo un administrador puede devolver una promoción con comentario.',
  'el ingeniero no escribe comentarios de devolución'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
update public.novedades
   set estado = 'borrador', comentario_revision = 'Falta la fecha de fin.'
 where slug = 'promo-0028';

select ok(
  (select bool_and(n.resuelta_en is not null) from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id where v.slug = 'promo-0028'),
  'devolverla cierra el aviso'
);
select is(
  (select comentario_revision from public.novedades where slug = 'promo-0028'),
  'Falta la fecha de fin.', 'el comentario queda para el ingeniero'
);

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "rol": "ingeniero"}';
update public.novedades set estado = 'en_revision' where slug = 'promo-0028';

select is(
  (select comentario_revision from public.novedades where slug = 'promo-0028'),
  null, 'reenviarla limpia el comentario ya atendido'
);
select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-0028' and n.resuelta_en is null),
  1, 'reenviarla abre un aviso nuevo (y solo uno)'
);

select throws_ok(
  $$ update public.novedades set estado = 'publicado' where slug = 'promo-0028' $$,
  '23514', null,
  'el ingeniero sigue sin poder publicarla (regla de 0010)'
);

set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "rol": "administrador"}';
update public.novedades set estado = 'publicado' where slug = 'promo-0028';

select is(
  (select aprobada_por from public.novedades where slug = 'promo-0028'),
  '22222222-2222-2222-2222-222222222222'::uuid, 'publicarla deja quién la aprobó'
);
select is(
  (select count(*)::int from public.notificaciones n
     join public.novedades v on v.id = n.novedad_id
    where v.slug = 'promo-0028' and n.resuelta_en is null),
  0, 'publicarla cierra el aviso'
);

select * from finish();
rollback;
