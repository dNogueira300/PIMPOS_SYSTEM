-- =============================================================================
-- 0011_insumos.sql
-- Unidades, equivalencias, proveedores, almacenes e insumos (R11; doc 02 §9.1).
--
-- El kardex propiamente dicho -- lotes, movimientos y saldos -- va en 0012.
-- Se separan porque juntos serian un archivo imposible de revisar, y porque
-- esto es catalogo estable mientras aquello es logica de calculo.
--
-- LA DECISION QUE ORDENA TODO ESTE ARCHIVO: la equivalencia cuelga del INSUMO,
-- no es global. Los datos de la ficha 7.2 lo demuestran solos:
--
--     un saco de harina  = 50 kg      un saco de sal          = 25 kg
--     una caja de manteca = 10 kg     una caja de huevos      = 100 unidades
--                                     una caja de fruta conf. =  5 kg
--
-- Una tabla global de conversiones seria incorrecta desde el primer registro:
-- "saco" no significa nada por si solo. Y el error no daria la cara -- el
-- sistema seguiria sumando, con el numero equivocado.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Unidades de medida (ficha 7.4)
-- -----------------------------------------------------------------------------
create table public.unidades_medida (
  id     uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[a-z_]+$'),
  nombre text not null check (length(btrim(nombre)) > 0),
  -- Sirve para impedir conversiones sin sentido: nadie deberia poder declarar
  -- que un kilo son tres litros.
  tipo   text not null check (tipo in ('masa', 'volumen', 'conteo')),
  -- Las de compra (saco, caja, paquete) no sirven como unidad base de un
  -- insumo: "3 sacos" no es una cantidad hasta saber de que insumo se habla.
  es_base boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.unidades_medida is
  'Catalogo de unidades. Las de presentacion (saco, caja) solo tienen sentido junto a un insumo.';

create trigger unidades_medida_set_updated_at
  before update on public.unidades_medida
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Proveedores (ficha 7.9)
-- -----------------------------------------------------------------------------
create table public.proveedores (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(btrim(nombre)) > 0),
  contacto    text,
  telefono    text,
  correo      text,
  direccion   text,
  observacion text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create unique index idx_proveedores_nombre on public.proveedores (lower(nombre))
  where deleted_at is null;

create trigger proveedores_set_updated_at
  before update on public.proveedores
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Almacenes
--
-- Hoy solo hay uno, pero el saldo se lleva POR almacen desde el principio: si
-- manana abren un segundo local, anadirlo es insertar una fila, no migrar todo
-- el historico de movimientos.
-- -----------------------------------------------------------------------------
create table public.almacenes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(btrim(nombre)) > 0),
  descripcion text,
  es_principal boolean not null default false,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

-- Como mucho un principal: es el que el formulario propone por defecto.
create unique index idx_almacenes_uno_principal on public.almacenes ((true))
  where es_principal and deleted_at is null;

create trigger almacenes_set_updated_at
  before update on public.almacenes
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Insumos (ficha 7.2)
-- -----------------------------------------------------------------------------
create table public.insumos (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null check (length(btrim(nombre)) > 0),
  descripcion     text,

  -- La unidad en la que se lleva el saldo. Todo movimiento se convierte a esta
  -- antes de sumarse: nadie suma sacos con kilos.
  unidad_base_id  uuid not null references public.unidades_medida(id) on delete restrict,

  -- Como se compra habitualmente ("Saco de 50kg"). Es texto libre porque es lo
  -- que el proveedor pone en la factura; la conversion util esta en
  -- `equivalencias`, no aqui.
  presentacion    text,

  -- Para las alertas de stock bajo (R12). Va en la unidad base.
  stock_minimo    numeric(14,4) not null default 0 check (stock_minimo >= 0),

  -- Los perecibles exigen fecha de vencimiento al ingresar (ver 0012) y entran
  -- en la alerta de vencimiento proximo.
  es_perecible    boolean not null default false,

  proveedor_habitual_id uuid references public.proveedores(id) on delete set null,
  imagen_url      text,
  activo          boolean not null default true,
  es_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  updated_by      uuid references auth.users(id),
  deleted_at      timestamptz
);

comment on column public.insumos.unidad_base_id is
  'Unidad en la que se lleva el saldo. Todo movimiento se convierte a esta antes de sumar.';
comment on column public.insumos.stock_minimo is
  'En la unidad base. Por debajo de esto salta la alerta (R12).';

create unique index idx_insumos_nombre on public.insumos (lower(nombre))
  where deleted_at is null;

-- "Buscar insumo por nombre" es la consulta del dia a dia en el panel.
create index idx_insumos_activos on public.insumos (nombre)
  where activo and deleted_at is null;
create index idx_insumos_perecibles on public.insumos (id)
  where es_perecible and deleted_at is null;

create trigger insumos_set_updated_at
  before update on public.insumos
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Equivalencias: la pieza con mas riesgo de error silencioso del sistema
--
-- "Un saco de harina son 50 kg". Cuelga del insumo, no es global.
-- -----------------------------------------------------------------------------
create table public.equivalencias (
  id           uuid primary key default gen_random_uuid(),
  insumo_id    uuid not null references public.insumos(id) on delete cascade,
  unidad_desde uuid not null references public.unidades_medida(id) on delete restrict,
  unidad_hacia uuid not null references public.unidades_medida(id) on delete restrict,
  -- 6 decimales: convertir gramos a kilos es 0.001, y una caja de 12 botellas
  -- a botella es 12. El rango real es amplio.
  factor       numeric(14,6) not null check (factor > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id),

  unique (insumo_id, unidad_desde, unidad_hacia),
  -- Una equivalencia de una unidad consigo misma no aporta nada y podria
  -- declarar un factor distinto de 1, que corromperia todos los calculos.
  constraint equivalencia_entre_unidades_distintas check (unidad_desde <> unidad_hacia)
);

comment on table public.equivalencias is
  'Cuanto vale una unidad de compra en la unidad base, PARA ESE INSUMO. Un saco de harina son 50 kg; uno de sal, 25.';
comment on column public.equivalencias.factor is
  'cantidad_en_unidad_hacia = cantidad_en_unidad_desde * factor';

create index idx_equivalencias_insumo on public.equivalencias (insumo_id, unidad_desde);

create trigger equivalencias_set_updated_at
  before update on public.equivalencias
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- La funcion de conversion.
--
-- Se declara aqui porque la usa el trigger del kardex (0012) y tambien
-- cualquier consulta que quiera mostrar una cantidad en otra unidad.
--
-- Lanza excepcion si no encuentra la equivalencia, y eso es deliberado: si
-- devolviera la cantidad sin convertir, o cero, el saldo quedaria mal sin que
-- nadie se enterara. Mejor que el registro falle y alguien lo mire.
-- -----------------------------------------------------------------------------
create or replace function app.convertir_a_base(
  p_insumo_id uuid,
  p_unidad_id uuid,
  p_cantidad  numeric
)
returns numeric
language plpgsql
stable
set search_path = ''
as $$
declare
  v_unidad_base uuid;
  v_factor      numeric(14,6);
begin
  select i.unidad_base_id into v_unidad_base
    from public.insumos i
   where i.id = p_insumo_id;

  if v_unidad_base is null then
    raise exception 'No existe el insumo %', p_insumo_id
      using errcode = 'foreign_key_violation';
  end if;

  -- Caso mas comun: ya viene en la unidad base.
  if p_unidad_id = v_unidad_base then
    return p_cantidad;
  end if;

  select e.factor into v_factor
    from public.equivalencias e
   where e.insumo_id    = p_insumo_id
     and e.unidad_desde = p_unidad_id
     and e.unidad_hacia = v_unidad_base;

  if v_factor is null then
    raise exception
      'No hay equivalencia de % a la unidad base de este insumo. Registrala antes de mover stock.',
      (select u.nombre from public.unidades_medida u where u.id = p_unidad_id)
      using errcode = 'no_data_found',
            hint = 'Cada insumo tiene sus propias equivalencias: un saco de harina son 50 kg, uno de sal 25.';
  end if;

  return p_cantidad * v_factor;
end;
$$;

comment on function app.convertir_a_base(uuid, uuid, numeric) is
  'Convierte una cantidad a la unidad base del insumo. Lanza excepcion si falta la equivalencia: fallar es mejor que sumar mal.';

grant execute on function app.convertir_a_base(uuid, uuid, numeric) to authenticated;

-- -----------------------------------------------------------------------------
-- Auditoria (R9)
-- -----------------------------------------------------------------------------
select app.auditar('public.proveedores');
select app.auditar('public.almacenes');
select app.auditar('public.insumos');
select app.auditar('public.equivalencias');

-- =============================================================================
-- RLS (doc 02 §11)
--
-- Nada de esto es publico: el inventario de un negocio no le incumbe a un
-- visitante. Y el repartidor tampoco entra -- la ficha le da acceso solo a
-- clientes.
-- =============================================================================
alter table public.unidades_medida enable row level security;
alter table public.proveedores     enable row level security;
alter table public.almacenes       enable row level security;
alter table public.insumos         enable row level security;
alter table public.equivalencias   enable row level security;

alter table public.unidades_medida force row level security;
alter table public.proveedores     force row level security;
alter table public.almacenes       force row level security;
alter table public.insumos         force row level security;
alter table public.equivalencias   force row level security;

-- Sin ninguna politica `to anon`. Un anonimo no ve nada de aqui.

-- Las unidades las lee cualquier autenticado (los formularios las necesitan),
-- pero no se editan desde la API: el catalogo lo fija esta migracion.
create policy "autenticado lee las unidades"
  on public.unidades_medida for select to authenticated using (true);

create policy "insumos lee proveedores"
  on public.proveedores for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "insumos gestiona proveedores"
  on public.proveedores for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "insumos lee almacenes"
  on public.almacenes for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "insumos gestiona almacenes"
  on public.almacenes for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador')))
  with check ((select app.es_rol('superadmin', 'administrador')));

create policy "insumos lee insumos"
  on public.insumos for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "insumos gestiona insumos"
  on public.insumos for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

create policy "insumos lee equivalencias"
  on public.equivalencias for select to authenticated
  using ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));
create policy "insumos gestiona equivalencias"
  on public.equivalencias for all to authenticated
  using      ((select app.es_rol('superadmin', 'administrador', 'ingeniero')))
  with check ((select app.es_rol('superadmin', 'administrador', 'ingeniero')));

-- =============================================================================
-- Catalogo de unidades y el almacen principal.
--
-- Van en la migracion porque el sistema no funciona sin ellos: sin unidades no
-- se puede registrar un movimiento, y sin almacen no hay donde.
-- =============================================================================
insert into public.unidades_medida (codigo, nombre, tipo, es_base) values
  -- Unidades base: en estas se lleva el saldo.
  ('kg',       'Kilogramo',  'masa',    true),
  ('g',        'Gramo',      'masa',    true),
  ('l',        'Litro',      'volumen', true),
  ('ml',       'Mililitro',  'volumen', true),
  ('unidad',   'Unidad',     'conteo',  true),
  ('rollo',    'Rollo',      'conteo',  true),
  -- Unidades de presentacion: solo significan algo junto a un insumo.
  ('saco',     'Saco',       'conteo',  false),
  ('caja',     'Caja',       'conteo',  false),
  ('bolsa',    'Bolsa',      'conteo',  false),
  ('paquete',  'Paquete',    'conteo',  false),
  ('botella',  'Botella',    'conteo',  false)
on conflict (codigo) do nothing;

insert into public.almacenes (nombre, descripcion, es_principal)
select 'Almacén principal', 'El almacén del local de la Calle Elías Aguirre.', true
where not exists (select 1 from public.almacenes where es_principal);
