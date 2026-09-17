-- ============================================================================
-- LA GRANJA DEL POLLO — Base de datos (Supabase / PostgreSQL)
-- Pega todo este archivo en Supabase > SQL Editor y presiona RUN.
-- Se puede volver a ejecutar sin problema (es idempotente).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- TABLAS ---

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  nombre      text,
  rol         text not null default 'vendedor' check (rol in ('admin','vendedor')),
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.configuracion (
  id             smallint primary key default 1 check (id = 1),
  precio_carton  numeric(12,2) not null default 0,
  alerta_stock   integer       not null default 10,
  moneda         text          not null default 'RD$',
  updated_at     timestamptz   not null default now()
);
insert into public.configuracion (id) values (1) on conflict (id) do nothing;

create table if not exists public.entradas (
  id             uuid primary key default gen_random_uuid(),
  fecha          date not null default current_date,
  cartones       integer not null check (cartones > 0),
  costo_carton   numeric(12,2) not null check (costo_carton >= 0),
  proveedor      text,
  nota           text,
  registrado_por uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create table if not exists public.ventas (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null default current_date,
  cartones      integer not null check (cartones > 0),
  precio_carton numeric(12,2) not null,
  costo_carton  numeric(12,2) not null,
  total         numeric(14,2) generated always as (cartones * precio_carton) stored,
  ganancia      numeric(14,2) generated always as (cartones * (precio_carton - costo_carton)) stored,
  cliente       text,
  metodo_pago   text not null default 'efectivo'
                check (metodo_pago in ('efectivo','transferencia','tarjeta','credito')),
  vendedor_id   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists ventas_fecha_idx    on public.ventas(fecha);
create index if not exists ventas_vendedor_idx on public.ventas(vendedor_id);
create index if not exists entradas_fecha_idx  on public.entradas(fecha);

-- ------------------------------------------------------------- FUNCIONES ---

-- ¿El usuario que hace la petición es administrador?
-- SECURITY DEFINER para que las políticas RLS puedan usarla sin recursión.
create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.rol = 'admin' and p.activo from public.profiles p where p.id = auth.uid()),
    false);
$$;

create or replace function public.stock_actual()
returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select sum(cartones)::int from public.entradas), 0)
       - coalesce((select sum(cartones)::int from public.ventas), 0);
$$;

-- Costo promedio ponderado de todas las entradas registradas.
create or replace function public.costo_promedio()
returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select round(sum(cartones * costo_carton) / nullif(sum(cartones), 0), 2)
       from public.entradas), 0);
$$;

-- El registro público solo está abierto mientras no exista ningún usuario:
-- el primero en registrarse queda como administrador.
create or replace function public.registro_abierto()
returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles);
$$;

-- Al crear un usuario en auth, se crea su perfil automáticamente.
-- El primero es admin; los demás entran como vendedor (el rol NUNCA se toma
-- de datos enviados por el navegador, para evitar escalada de privilegios).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_rol text;
begin
  v_rol := case when exists (select 1 from public.profiles) then 'vendedor' else 'admin' end;
  insert into public.profiles (id, email, nombre, rol)
  values (new.id,
          new.email,
          coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)),
          v_rol)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nadie puede cambiarse el rol a sí mismo: solo un admin (o el servidor con
-- la llave de servicio) puede tocar 'rol' y 'activo'.
create or replace function public.proteger_rol()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if (new.rol is distinct from old.rol or new.activo is distinct from old.activo)
     and not public.es_admin() then
    raise exception 'No tienes permiso para cambiar el rol o el estado de un usuario';
  end if;
  new.id := old.id;
  return new;
end $$;

drop trigger if exists trg_proteger_rol on public.profiles;
create trigger trg_proteger_rol
  before update on public.profiles
  for each row execute function public.proteger_rol();

-- Siempre debe quedar al menos un administrador activo.
create or replace function public.proteger_ultimo_admin()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_admins int;
begin
  select count(*) into v_admins from public.profiles where rol = 'admin' and activo;
  if tg_op = 'DELETE' then
    if old.rol = 'admin' and old.activo and v_admins <= 1 then
      raise exception 'No puedes eliminar al único administrador activo';
    end if;
    return old;
  else
    if old.rol = 'admin' and old.activo
       and (new.rol <> 'admin' or not new.activo) and v_admins <= 1 then
      raise exception 'Debe quedar al menos un administrador activo';
    end if;
    return new;
  end if;
end $$;

drop trigger if exists trg_ultimo_admin_upd on public.profiles;
create trigger trg_ultimo_admin_upd
  before update on public.profiles
  for each row execute function public.proteger_ultimo_admin();

drop trigger if exists trg_ultimo_admin_del on public.profiles;
create trigger trg_ultimo_admin_del
  before delete on public.profiles
  for each row execute function public.proteger_ultimo_admin();

-- -------------------------------------------------------------- RLS ---------

alter table public.profiles      enable row level security;
alter table public.configuracion enable row level security;
alter table public.entradas      enable row level security;
alter table public.ventas        enable row level security;

drop policy if exists "perfiles: ver propio o admin ve todos"  on public.profiles;
drop policy if exists "perfiles: editar propio o admin"        on public.profiles;
drop policy if exists "perfiles: admin elimina"                on public.profiles;
create policy "perfiles: ver propio o admin ve todos" on public.profiles
  for select to authenticated using (id = auth.uid() or public.es_admin());
create policy "perfiles: editar propio o admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.es_admin())
  with check (id = auth.uid() or public.es_admin());
create policy "perfiles: admin elimina" on public.profiles
  for delete to authenticated using (public.es_admin());

drop policy if exists "config: todos leen"     on public.configuracion;
drop policy if exists "config: admin modifica" on public.configuracion;
create policy "config: todos leen" on public.configuracion
  for select to authenticated using (true);
create policy "config: admin modifica" on public.configuracion
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- Las entradas contienen COSTOS: solo el administrador puede verlas o tocarlas.
drop policy if exists "entradas: solo admin" on public.entradas;
create policy "entradas: solo admin" on public.entradas
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Ventas: el vendedor solo ve las suyas; el admin ve todas.
-- No hay política de INSERT ni UPDATE: las ventas se registran únicamente
-- mediante la función registrar_venta(), que fija precio y costo del lado del
-- servidor (el navegador no puede inventar precios).
drop policy if exists "ventas: ver propias o admin" on public.ventas;
drop policy if exists "ventas: admin elimina"       on public.ventas;
create policy "ventas: ver propias o admin" on public.ventas
  for select to authenticated using (public.es_admin() or vendedor_id = auth.uid());
create policy "ventas: admin elimina" on public.ventas
  for delete to authenticated using (public.es_admin());

-- Permisos a nivel de COLUMNA: ni siquiera llamando a la API directamente se
-- pueden leer 'costo_carton' ni 'ganancia' desde la tabla.
revoke all on public.ventas        from anon, authenticated;
revoke all on public.entradas      from anon;
revoke all on public.profiles      from anon;
revoke all on public.configuracion from anon;
grant select (id, fecha, cartones, precio_carton, total, cliente, metodo_pago,
              vendedor_id, created_at)
  on public.ventas to authenticated;
grant delete on public.ventas to authenticated;

-- ------------------------------------------------- FUNCIONES DE NEGOCIO -----

-- Registra una venta. El precio sale de configuracion y el costo del promedio
-- ponderado: ambos se calculan en el servidor, no se reciben del cliente.
create or replace function public.registrar_venta(
  p_cartones integer,
  p_cliente  text default null,
  p_metodo   text default 'efectivo'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_id     uuid;
  v_precio numeric;
  v_costo  numeric;
  v_stock  integer;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión para registrar una venta';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and activo) then
    raise exception 'Tu cuenta está desactivada';
  end if;
  if p_cartones is null or p_cartones <= 0 then
    raise exception 'La cantidad de cartones debe ser mayor que cero';
  end if;
  if p_metodo not in ('efectivo','transferencia','tarjeta','credito') then
    raise exception 'Método de pago no válido';
  end if;

  -- Bloqueo para evitar que dos ventas simultáneas dejen el stock negativo.
  perform pg_advisory_xact_lock(918273645);

  v_stock := public.stock_actual();
  if p_cartones > v_stock then
    raise exception 'Stock insuficiente: solo quedan % cartones', v_stock;
  end if;

  select precio_carton into v_precio from public.configuracion where id = 1;
  if v_precio is null or v_precio <= 0 then
    raise exception 'Falta definir el precio de venta por cartón';
  end if;

  v_costo := public.costo_promedio();

  insert into public.ventas (cartones, precio_carton, costo_carton, cliente, metodo_pago, vendedor_id)
  values (p_cartones, v_precio, v_costo, nullif(trim(p_cliente), ''), p_metodo, v_uid)
  returning id into v_id;

  return v_id;
end $$;

-- Resumen del panel. Devuelve datos de ganancia y costo solo si eres admin.
create or replace function public.resumen()
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_admin boolean := public.es_admin();
  v_uid   uuid    := auth.uid();
  v_stock integer;
  v_res   json;
begin
  if v_uid is null then raise exception 'Debes iniciar sesión'; end if;
  v_stock := public.stock_actual();

  select json_build_object(
    'es_admin',      v_admin,
    'stock',         v_stock,
    'precio_carton', c.precio_carton,
    'alerta_stock',  c.alerta_stock,
    'moneda',        c.moneda,
    'cartones_hoy',  coalesce((select sum(v.cartones) from public.ventas v
                                where v.fecha = current_date
                                  and (v_admin or v.vendedor_id = v_uid)), 0),
    'total_hoy',     coalesce((select sum(v.total) from public.ventas v
                                where v.fecha = current_date
                                  and (v_admin or v.vendedor_id = v_uid)), 0),
    'total_semana',  coalesce((select sum(v.total) from public.ventas v
                                where v.fecha >= current_date - 6
                                  and (v_admin or v.vendedor_id = v_uid)), 0),
    'total_mes',     coalesce((select sum(v.total) from public.ventas v
                                where v.fecha >= date_trunc('month', current_date)::date
                                  and (v_admin or v.vendedor_id = v_uid)), 0),
    'ganancia_hoy',  case when v_admin then coalesce((select sum(v.ganancia) from public.ventas v
                                where v.fecha = current_date), 0) end,
    'ganancia_mes',  case when v_admin then coalesce((select sum(v.ganancia) from public.ventas v
                                where v.fecha >= date_trunc('month', current_date)::date), 0) end,
    'costo_promedio',   case when v_admin then public.costo_promedio() end,
    'valor_inventario', case when v_admin then round(public.costo_promedio() * v_stock, 2) end
  ) into v_res
  from public.configuracion c where c.id = 1;

  return v_res;
end $$;

-- Historial de ventas. La ganancia viaja en NULL si quien consulta no es admin.
create or replace function public.listar_ventas(
  p_desde    date default null,
  p_hasta    date default null,
  p_vendedor uuid default null,
  p_limite   integer default 300
) returns table (
  id uuid, fecha date, cartones integer, precio_carton numeric,
  total numeric, ganancia numeric, cliente text, metodo_pago text,
  vendedor text, vendedor_id uuid, created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_admin boolean := public.es_admin();
  v_uid   uuid    := auth.uid();
begin
  if v_uid is null then raise exception 'Debes iniciar sesión'; end if;
  return query
    select v.id, v.fecha, v.cartones, v.precio_carton, v.total,
           case when v_admin then v.ganancia else null end,
           v.cliente, v.metodo_pago,
           coalesce(nullif(p.nombre, ''), p.email, 'Sin asignar'),
           v.vendedor_id, v.created_at
    from public.ventas v
    left join public.profiles p on p.id = v.vendedor_id
    where (v_admin or v.vendedor_id = v_uid)
      and (p_desde is null or v.fecha >= p_desde)
      and (p_hasta is null or v.fecha <= p_hasta)
      and (p_vendedor is null or v.vendedor_id = p_vendedor)
    order by v.created_at desc
    limit greatest(1, least(coalesce(p_limite, 300), 1000));
end $$;

-- Serie para las gráficas de reportes. Solo administradores.
create or replace function public.reporte(
  p_desde date,
  p_hasta date,
  p_agrupar text default 'dia'
) returns table (
  periodo date, cartones bigint, ingresos numeric, costos numeric, ganancia numeric
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede ver los reportes';
  end if;
  return query
    select date_trunc(case p_agrupar when 'mes' then 'month'
                                     when 'semana' then 'week'
                                     else 'day' end, v.fecha)::date,
           sum(v.cartones)::bigint,
           sum(v.total),
           sum(v.cartones * v.costo_carton),
           sum(v.ganancia)
    from public.ventas v
    where v.fecha between p_desde and p_hasta
    group by 1
    order by 1;
end $$;

-- Anula (elimina) una venta y devuelve los cartones al inventario.
create or replace function public.anular_venta(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede anular ventas';
  end if;
  delete from public.ventas where id = p_id;
end $$;

grant execute on function public.registro_abierto() to anon, authenticated;
grant execute on function public.registrar_venta(integer, text, text) to authenticated;
grant execute on function public.resumen() to authenticated;
grant execute on function public.listar_ventas(date, date, uuid, integer) to authenticated;
grant execute on function public.reporte(date, date, text) to authenticated;
grant execute on function public.anular_venta(uuid) to authenticated;
grant execute on function public.stock_actual() to authenticated;
grant execute on function public.es_admin() to authenticated;
revoke execute on function public.costo_promedio() from anon, authenticated;

-- ============================================================================
-- Listo. Siguiente paso: crea tu usuario administrador desde la página
-- /registro de la aplicación (solo funciona una vez, mientras no haya usuarios).
-- ============================================================================
