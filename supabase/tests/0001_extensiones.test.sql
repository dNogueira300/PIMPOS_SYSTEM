-- Verifica que la migracion 0001 dejo la base con lo que el plan exige.
-- Corresponde a la comprobacion 2 del cierre de Fase 0 (doc 01 §10).
begin;
select plan(9);

-- --- Esquema privado ---------------------------------------------------------
select has_schema('app', 'existe el esquema privado app');

-- `app` no debe estar expuesto por PostgREST. Eso lo fija config.toml
-- ([api] schemas), que no es consultable desde SQL; lo que si se puede
-- comprobar es que los roles de la API no pueden crear objetos dentro.
select ok(
  not has_schema_privilege('anon', 'app', 'CREATE'),
  'anon no puede crear objetos en el esquema app'
);
select ok(
  not has_schema_privilege('authenticated', 'app', 'CREATE'),
  'authenticated no puede crear objetos en el esquema app'
);

-- --- Extensiones obligatorias (doc 01 §3.3) ----------------------------------
select has_extension('extensions', 'pgcrypto', 'pgcrypto instalada');
select has_extension('extensions', 'pg_trgm',  'pg_trgm instalada');
select has_extension('extensions', 'unaccent', 'unaccent instalada');
select has_extension('extensions', 'pgtap',    'pgtap instalada');

select ok(
  exists (select 1 from pg_extension where extname = 'pg_cron'),
  'pg_cron instalada'
);

-- gen_random_uuid() tiene que resolverse sin calificar: las claves primarias
-- de todo el esquema dependen de ello.
select ok(
  gen_random_uuid() is not null,
  'gen_random_uuid() resuelve en el search_path por defecto'
);

select * from finish();
rollback;
