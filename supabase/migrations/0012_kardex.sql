-- =============================================================================
-- 0012_kardex.sql
-- Lotes, movimientos y saldos de insumo (R11, R12; doc 02 §9.2 y §9.3).
--
-- Tres decisiones sostienen todo el modulo:
--
-- 1. UNA SOLA TABLA de movimientos para ingreso, consumo y baja. Tres tablas
--    separadas acaban contradiciendose y nadie sabe cual tiene razon.
--
-- 2. `cantidad_base` la calcula un TRIGGER aplicando la equivalencia del
--    insumo. Si la calculara la aplicacion, el dia que alguien inserte una
--    fila desde el SQL Editor el saldo quedaria mal en silencio.
--
-- 3. El SALDO SE DERIVA de los movimientos y nunca se edita a mano. Se puede
--    recalcular entero en cualquier momento, y eso es lo que hace fiable el
--    numero: si no cuadra, se recalcula y se ve donde estaba el error.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Lotes (para los perecibles y la alerta de vencimiento, R12)
-- -----------------------------------------------------------------------------
create table public.lotes_insumo (
  id                uuid primary key default gen_random_uuid(),
  insumo_id         uuid not null references public.insumos(id) on delete cascade,
  codigo            text,
  fecha_vencimiento date,
  observacion       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);

comment on table public.lotes_insumo is
  'Agrupa lo que entro junto y vence junto. Solo hace falta en los insumos perecibles.';

create unique index idx_lotes_codigo on public.lotes_insumo (insumo_id, codigo)
  where codigo is not null;

-- "Que vence en los proximos 15 dias" es la consulta de la alerta diaria.
create index idx_lotes_vencimiento on public.lotes_insumo (fecha_vencimiento)
  where fecha_vencimiento is not null;

create trigger lotes_insumo_set_updated_at
  before update on public.lotes_insumo
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Movimientos: el kardex
-- -----------------------------------------------------------------------------
create table public.movimientos_insumo (
  id             uuid primary key default gen_random_uuid(),

  -- Orden de asiento. Un kardex es un libro: el orden importa, y `ocurrido_en`
  -- no basta para desempatar -- lo escribe la persona y puede repetirse, y su
  -- valor por defecto `now()` es la hora de INICIO de la transaccion, asi que
  -- dos movimientos registrados juntos salen con la marca identica.
  -- Mismo criterio que app.auditoria y precio_historial.
  secuencia      bigint generated always as identity unique,
  tipo           app.tipo_movimiento not null,
  insumo_id      uuid not null references public.insumos(id) on delete restrict,
  almacen_id     uuid not null references public.almacenes(id) on delete restrict,
  lote_id        uuid references public.lotes_insumo(id) on delete restrict,

  -- Lo que la persona escribio: "3 sacos".
  cantidad       numeric(14,4) not null check (cantidad > 0),
  unidad_id      uuid not null references public.unidades_medida(id) on delete restrict,

  -- Lo mismo en la unidad base del insumo: 150 kg. Lo calcula el trigger; la
  -- aplicacion no lo manda nunca.
  cantidad_base  numeric(14,4) not null,

  ocurrido_en    timestamptz not null default now(),
  responsable_id uuid not null references auth.users(id) on delete restrict,
  observacion    text,

  -- --- Solo ingreso (ficha 7.5) ---------------------------------------------
  proveedor_id     uuid references public.proveedores(id) on delete restrict,
  documento_tipo   text check (documento_tipo is null or documento_tipo in ('boleta', 'factura', 'guia')),
  documento_numero text,
  precio_unitario  numeric(12,4) check (precio_unitario is null or precio_unitario >= 0),
  costo_total      numeric(14,4) check (costo_total is null or costo_total >= 0),

  -- --- Solo consumo (ficha 7.6) ---------------------------------------------
  origen_consumo app.origen_consumo,
  destino_lote   text,
  area_turno     text,

  -- --- Solo baja (ficha 7.7) ------------------------------------------------
  motivo_baja    app.motivo_baja,
  autorizado_por uuid references auth.users(id) on delete restrict,

  created_at     timestamptz not null default now(),
  created_by     uuid references auth.users(id),

  -- Un ingreso sin proveedor ni documento no se puede rastrear ni cuadrar con
  -- la contabilidad (ficha 7.5).
  constraint ingreso_completo check (
    tipo <> 'ingreso' or (proveedor_id is not null and documento_tipo is not null)
  ),

  -- La ficha 7.7 exige autorizacion del encargado para dar de baja. Si eso
  -- viviera solo en el formulario, una peticion directa a la API se lo saltaria.
  constraint baja_autorizada check (
    tipo <> 'baja' or (motivo_baja is not null and autorizado_por is not null)
  ),

  -- Los campos de un tipo no se rellenan en otro: un consumo con proveedor
  -- seria un dato incoherente que luego nadie sabe interpretar.
  constraint campos_de_ingreso_solo_en_ingreso check (
    tipo = 'ingreso'
    or (proveedor_id is null and documento_tipo is null and documento_numero is null
        and precio_unitario is null and costo_total is null)
  ),
  constraint campos_de_consumo_solo_en_consumo check (
    tipo = 'consumo' or (origen_consumo is null and destino_lote is null and area_turno is null)
  ),
  constraint campos_de_baja_solo_en_baja check (
    tipo = 'baja' or (motivo_baja is null and autorizado_por is null)
  )
);

comment on table public.movimientos_insumo is
  'El kardex. Una sola tabla para ingreso, consumo y baja. Solo se inserta: un error se corrige con un movimiento contrario.';
comment on column public.movimientos_insumo.cantidad_base is
  'La cantidad en la unidad base del insumo. La calcula un trigger; nunca se manda desde la aplicacion.';

-- El reporte mas consultado es "movimientos de un insumo en un periodo".
-- La secuencia desempata cuando dos caen en el mismo instante.
create index idx_mov_insumo_fecha on public.movimientos_insumo (insumo_id, ocurrido_en desc, secuencia desc);
create index idx_mov_tipo_fecha   on public.movimientos_insumo (tipo, ocurrido_en desc);
create index idx_mov_almacen      on public.movimientos_insumo (almacen_id, ocurrido_en desc);
-- Para las mermas por motivo (ficha 7.8, prioridad 1).
create index idx_mov_motivo_baja  on public.movimientos_insumo (motivo_baja, ocurrido_en desc)
  where tipo = 'baja';

-- -----------------------------------------------------------------------------
-- Saldos: derivados, nunca editados a mano
-- -----------------------------------------------------------------------------
create table public.saldos_insumo (
  insumo_id      uuid not null references public.insumos(id) on delete cascade,
  almacen_id     uuid not null references public.almacenes(id) on delete cascade,
  cantidad_base  numeric(14,4) not null default 0,
  actualizado_en timestamptz not null default now(),

  primary key (insumo_id, almacen_id)
);

comment on table public.saldos_insumo is
  'Saldo por insumo y almacen, en la unidad base. Lo mantiene un trigger desde movimientos_insumo. NUNCA se edita a mano.';

-- La alerta de stock bajo cruza esto con `insumos.stock_minimo`.
create index idx_saldos_cantidad on public.saldos_insumo (cantidad_base);

-- -----------------------------------------------------------------------------
-- El trigger que convierte: donde vive el riesgo de error silencioso
-- -----------------------------------------------------------------------------
create or replace function app.calcular_cantidad_base()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Se ignora lo que venga en `cantidad_base`: lo calcula la base, siempre.
  -- Si se aceptara el valor de la aplicacion, bastaria una peticion directa a
  -- la API con un numero inventado para descuadrar el inventario.
  new.cantidad_base := app.convertir_a_base(new.insumo_id, new.unidad_id, new.cantidad);

  -- Un perecible sin fecha de vencimiento no puede entrar en la alerta de
  -- vencimiento proximo, que es prioridad 1 de la ficha (7.8).
  if new.tipo = 'ingreso'
     and (select i.es_perecible from public.insumos i where i.id = new.insumo_id)
     and (new.lote_id is null
          or (select l.fecha_vencimiento from public.lotes_insumo l where l.id = new.lote_id) is null)
  then
    raise exception 'Este insumo es perecible: el ingreso necesita un lote con fecha de vencimiento'
      using errcode = 'check_violation',
            hint = 'Registra el lote con su fecha antes de dar entrada al insumo.';
  end if;

  return new;
end;
$$;

comment on function app.calcular_cantidad_base() is
  'Trigger BEFORE INSERT en movimientos_insumo: convierte a la unidad base y exige lote con vencimiento en los perecibles.';

create trigger movimientos_calcular_base
  before insert on public.movimientos_insumo
  for each row execute function app.calcular_cantidad_base();

-- -----------------------------------------------------------------------------
-- El trigger que mantiene el saldo
-- -----------------------------------------------------------------------------
create or replace function app.actualizar_saldo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_signo integer;
begin
  -- Ingreso suma; consumo y baja restan.
  v_signo := case new.tipo when 'ingreso' then 1 else -1 end;

  insert into public.saldos_insumo (insumo_id, almacen_id, cantidad_base, actualizado_en)
  values (new.insumo_id, new.almacen_id, v_signo * new.cantidad_base, now())
  on conflict (insumo_id, almacen_id) do update
    set cantidad_base  = public.saldos_insumo.cantidad_base + excluded.cantidad_base,
        actualizado_en = now();

  return null;
end;
$$;

comment on function app.actualizar_saldo() is
  'Trigger AFTER INSERT en movimientos_insumo: mantiene saldos_insumo.';

revoke execute on function app.actualizar_saldo() from public, anon, authenticated;

create trigger movimientos_actualizar_saldo
  after insert on public.movimientos_insumo
  for each row execute function app.actualizar_saldo();

-- -----------------------------------------------------------------------------
-- Recalculo completo.
--
-- Esto es lo que hace fiable el saldo: si algun dia no cuadra, se recalcula
-- desde los movimientos y se ve el numero verdadero. Un saldo que solo se
-- puede creer no sirve de nada.
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
  delete from public.saldos_insumo;

  insert into public.saldos_insumo (insumo_id, almacen_id, cantidad_base, actualizado_en)
  select m.insumo_id,
         m.almacen_id,
         sum(case m.tipo when 'ingreso' then m.cantidad_base else -m.cantidad_base end),
         now()
    from public.movimientos_insumo m
   group by m.insumo_id, m.almacen_id;

  get diagnostics v_filas = row_count;
  return v_filas;
end;
$$;

comment on function app.recalcular_saldos() is
  'Reconstruye saldos_insumo desde los movimientos. Devuelve cuantas filas quedaron.';

revoke execute on function app.recalcular_saldos() from public, anon, authenticated;
-- Solo administracion, y desde una Server Action: no es una operacion de uso
-- diario, es la que se ejecuta cuando algo no cuadra.

-- -----------------------------------------------------------------------------
-- Auditoria (R9)
-- -----------------------------------------------------------------------------
select app.auditar('public.lotes_insumo');
select app.auditar('public.movimientos_insumo');
-- `saldos_insumo` NO se audita: es un valor derivado, y auditarlo duplicaria
-- cada movimiento con una fila mas que no anade informacion.

-- =============================================================================
-- RLS (doc 02 §11)
--
-- Nada publico. Y el repartidor no entra: la ficha le da acceso solo a
-- clientes, y `insumos` es justamente lo que no debe ver.
-- =============================================================================
alter table public.lotes_insumo       enable row level security;
alter table public.movimientos_insumo enable row level security;
alter table public.saldos_insumo      enable row level security;

alter table public.lotes_insumo       force row level security;
alter table public.movimientos_insumo force row level security;
alter table public.saldos_insumo      force row level security;

create policy "insumos lee lotes"
  on public.lotes_insumo for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "insumos gestiona lotes"
  on public.lotes_insumo for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "insumos lee movimientos"
  on public.movimientos_insumo for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- Solo INSERT. Sin UPDATE ni DELETE, y es deliberado: un kardex es un registro
-- de hechos. Un error no se borra, se corrige con un movimiento contrario, que
-- es como funciona cualquier libro de inventario -- y asi el historial cuenta
-- lo que de verdad paso, incluida la equivocacion.
create policy "insumos registra movimientos"
  on public.movimientos_insumo for insert to authenticated
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- Los saldos se leen; escribirlos es cosa del trigger.
create policy "insumos lee saldos"
  on public.saldos_insumo for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- -----------------------------------------------------------------------------
-- Y ademas se revoca el privilegio, no solo se omite la politica.
--
-- En el esquema `public`, Supabase concede por defecto todos los privilegios a
-- `anon` y `authenticated`, asi que una tabla sin politica de UPDATE no lanza
-- error: la RLS filtra y la operacion afecta a cero filas, en silencio.
--
-- Para un kardex eso no basta. Que un intento de alterar un asiento se deniegue
-- de forma explicita, y no se quede en un "no paso nada", es la diferencia entre
-- una regla que se ve y una que hay que adivinar leyendo las politicas.
-- -----------------------------------------------------------------------------
revoke update, delete on public.movimientos_insumo from anon, authenticated;
revoke insert, update, delete on public.saldos_insumo from anon, authenticated;
