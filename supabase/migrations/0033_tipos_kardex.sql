-- =============================================================================
-- 0033_tipos_kardex.sql
-- Dos tipos de movimiento nuevos para el kárdex (F5, tarea 1).
--
--   ajuste    — el conteo físico: «hay 40 kg» y la base registra la diferencia.
--               También es como se carga el inventario inicial.
--   anulacion — el contrario exacto de un movimiento equivocado, enlazado a él.
--
-- Van solos en esta migración porque Postgres no deja usar un valor de enum
-- en la misma transacción que lo añade. 0034 ya los usa.
-- =============================================================================
alter type app.tipo_movimiento add value if not exists 'ajuste';
alter type app.tipo_movimiento add value if not exists 'anulacion';
