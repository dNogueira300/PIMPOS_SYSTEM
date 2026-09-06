-- =============================================================================
-- 0001_extensiones.sql
-- Extensiones de Postgres y esquema privado `app`.
--
-- Plan: doc 02 §3 (orden de migraciones) y doc 01 §3.3 (tabla de extensiones).
-- Se activan por migracion, no a mano desde el panel: lo que no esta en una
-- migracion, no existe.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Esquema privado.
-- Todo lo que no necesita salir por la API vive aqui: auditoria, funciones
-- internas, hooks y trabajos programados. `app` NO se incluye en
-- [api] schemas de config.toml, asi que PostgREST no lo publica.
-- -----------------------------------------------------------------------------
create schema if not exists app;

comment on schema app is
  'Esquema privado: auditoria, funciones internas, hooks y cron. No expuesto por PostgREST.';

-- Solo los roles de Supabase operan aqui. `anon` y `authenticated` no reciben
-- USAGE por defecto; se concede funcion por funcion cuando una politica RLS
-- la necesite (ver 0002).
grant usage on schema app to postgres, service_role;

-- -----------------------------------------------------------------------------
-- Extensiones.
-- Supabase las aloja en el esquema `extensions`, que ya esta en el search_path
-- de la base. pg_cron es la excepcion: debe vivir en pg_catalog.
-- -----------------------------------------------------------------------------

-- gen_random_uuid() para las claves primarias.
-- (En Postgres 13+ la funcion tambien esta en core, pero pgcrypto se declara
--  explicitamente porque el plan la exige y aporta el resto de primitivas.)
create extension if not exists pgcrypto with schema extensions;

-- Busqueda por nombre parecido: "buscar cliente por nombre" es prioridad 1
-- (ficha 8.6). Habilita los indices GIN trigram de la migracion 0012.
create extension if not exists pg_trgm with schema extensions;

-- Que "Nunez" encuentre "Nuñez" y "paneton" encuentre "paneton".
create extension if not exists unaccent with schema extensions;

-- Pruebas automatizadas de las politicas RLS.
create extension if not exists pgtap with schema extensions;

-- Despublicar novedades vencidas (R7) y evaluar alertas de stock y
-- vencimiento (R12). Supabase lo requiere en pg_catalog.
-- OJO: si el proyecto se pausa por inactividad, pg_cron deja de ejecutarse.
-- El keep-alive de .github/workflows/keepalive-supabase.yml sostiene esto.
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
