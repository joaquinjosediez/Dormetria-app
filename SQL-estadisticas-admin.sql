-- ════════════════════════════════════════════════════════════════════
--  Estadísticas del administrador SIN leer datos de pacientes
--
--  Reemplaza a SQL-admin-puede-leer.sql, que estaba mal planteado: le daba
--  al administrador permiso de SELECT sobre sleep_diary entero. Para contar
--  noches no hace falta leer ninguna noche. Esto devuelve SOLO NÚMEROS
--  —conteos y promedios— calculados adentro de la base. Ninguna fila de
--  diario, ningún horario, ningún actograma, ningún comentario sale de acá.
--
--  Y de paso resuelve el otro problema: el panel traía las filas para
--  contarlas en el navegador y el servidor le devolvía como mucho 1.000
--  (el tope de PostgREST), así que los números salían cortos. Contando del
--  lado del servidor ese techo no existe.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Quién es administrador ────────────────────────────────────────
-- Hoy "ser admin" se decide del lado del cliente y para la base no existe,
-- así que no hay forma de escribir nada que lo contemple.
create table if not exists public.app_admins (
  email      text primary key,
  creado_en  timestamptz not null default now(),
  nota       text
);

alter table public.app_admins enable row level security;
-- Sin ninguna policy y con RLS activo, esta tabla no se puede leer ni
-- escribir desde la app. Se administra desde el panel de Supabase. Si se
-- pudiera escribir desde el cliente, cualquiera se haría administrador.

insert into public.app_admins (email, nota)
values ('drjoaquindiez@gmail.com', 'Titular del proyecto')
on conflict (email) do nothing;

create or replace function public.es_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to authenticated;

-- ── 2. Cartera de cada profesional, en números ───────────────────────
-- Devuelve una fila por profesional. NO devuelve pacientes ni noches:
-- devuelve cuántos y cuántas.
create or replace function public.admin_stats_profesionales()
returns table (
  doctor_email   text,
  pacientes      bigint,
  activaron      bigint,   -- registraron al menos una noche
  sostuvieron    bigint,   -- llegaron a 14 noches
  activos_30d    bigint    -- registraron algo en los últimos 30 días
)
language sql stable security definer
set search_path = public
as $$
  with vinculos as (
    select lower(dp.doctor_email)  as doctor_email,
           lower(dp.patient_email) as patient_email
    from   public.doctor_patients dp
    join   public.patients p on lower(p.email) = lower(dp.patient_email)
    -- Las cuentas de ejemplo no cuentan en ninguna estadística.
    where  coalesce(p.is_demo, false) = false
      and  lower(p.email) not like '%@demo.dormetria.com'
  ),
  noches as (
    select lower(d.patient_email) as patient_email,
           count(*)                                              as n,
           max(coalesce(d.created_at, d.diary_date::timestamptz)) as ultima
    from   public.sleep_diary d
    group  by 1
  )
  select v.doctor_email,
         count(*)                                                        as pacientes,
         count(*) filter (where coalesce(n.n,0) >= 1)                    as activaron,
         count(*) filter (where coalesce(n.n,0) >= 14)                   as sostuvieron,
         count(*) filter (where n.ultima > now() - interval '30 days')   as activos_30d
  from   vinculos v
  left   join noches n on n.patient_email = v.patient_email
  where  public.es_admin()          -- si no sos admin, no devuelve nada
  group  by v.doctor_email;
$$;

-- ── 3. Actividad por paciente, sin contenido ─────────────────────────
-- Cuántas noches y cuándo fue la última. Nada más. No hay horarios, ni
-- latencias, ni despertares, ni notas: solo el recuento y una fecha.
create or replace function public.admin_stats_pacientes()
returns table (
  patient_email  text,
  noches         bigint,
  dias_activos   bigint,
  ultima         timestamptz
)
language sql stable security definer
set search_path = public
as $$
  select lower(d.patient_email),
         count(*),
         count(distinct coalesce(d.created_at::date, d.diary_date)),
         max(coalesce(d.created_at, d.diary_date::timestamptz))
  from   public.sleep_diary d
  where  public.es_admin()
  group  by 1;
$$;

-- ── 4. Totales de plataforma ─────────────────────────────────────────
create or replace function public.admin_stats_global()
returns table (
  pacientes_total   bigint,
  pacientes_activos_7d  bigint,
  pacientes_activos_30d bigint,
  noches_total      bigint,
  escalas_total     bigint,
  ingresos_7d       bigint
)
language sql stable security definer
set search_path = public
as $$
  with reales as (
    select lower(email) as email from public.patients
    where coalesce(is_demo,false) = false
      and lower(email) not like '%@demo.dormetria.com'
  ),
  act as (
    select lower(patient_email) as email,
           max(coalesce(created_at, diary_date::timestamptz)) as ultima
    from public.sleep_diary group by 1
  )
  select (select count(*) from reales),
         (select count(*) from act join reales r on r.email = act.email
            where act.ultima > now() - interval '7 days'),
         (select count(*) from act join reales r on r.email = act.email
            where act.ultima > now() - interval '30 days'),
         (select count(*) from public.sleep_diary d join reales r on r.email = lower(d.patient_email)),
         (select count(*) from public.evaluations e join reales r on r.email = lower(e.patient_email)),
         (select count(*) from public.sleep_diary d join reales r on r.email = lower(d.patient_email)
            where coalesce(d.created_at, d.diary_date::timestamptz) > now() - interval '7 days')
  where public.es_admin();
$$;

-- ── 5. Permisos ──────────────────────────────────────────────────────
revoke all on function public.admin_stats_profesionales() from public, anon;
revoke all on function public.admin_stats_pacientes()     from public, anon;
revoke all on function public.admin_stats_global()        from public, anon;

grant execute on function public.admin_stats_profesionales() to authenticated;
grant execute on function public.admin_stats_pacientes()     to authenticated;
grant execute on function public.admin_stats_global()        to authenticated;

-- ── 6. Comprobación ──────────────────────────────────────────────────
--
--  OJO: `select public.es_admin()` desde el EDITOR SQL devuelve siempre
--  false, y está bien. El editor corre como rol de servicio, no como un
--  usuario logueado: ahí auth.jwt() es NULL y la función no tiene contra qué
--  comparar. La prueba de verdad es desde la app.
--
--  Lo que sí conviene comprobar acá es que el correo cargado en app_admins
--  sea EL DEL LOGIN. En este proyecto ya pasó una vez que el correo del
--  perfil y el del login de Supabase Auth eran distintos, y toda la RLS
--  fallaba en silencio por eso.

-- a) ¿Con qué correo iniciás sesión realmente?
select id, email, last_sign_in_at
from   auth.users
order  by last_sign_in_at desc nulls last
limit  10;

-- b) ¿Ese correo está en app_admins? Tiene que dar una fila con esta_en_admins = true.
select u.email,
       exists (select 1 from public.app_admins a
               where lower(a.email) = lower(u.email)) as esta_en_admins
from   auth.users u
order  by u.last_sign_in_at desc nulls last
limit  10;

-- c) Si no está, agregalo con el correo EXACTO de la consulta (a):
-- insert into public.app_admins (email, nota)
-- values ('el-correo-del-login@ejemplo.com', 'Titular del proyecto')
-- on conflict (email) do nothing;

-- d) Estas dos, desde el editor, devuelven vacío por lo mismo que (a).
--    Para probarlas de verdad hay que llamarlas desde la app.
--    Si querés verlas acá, corré la versión sin el filtro:
select count(*) as noches_en_la_base from public.sleep_diary;

-- ── Qué se ve y qué NO ───────────────────────────────────────────────
--  SE VE     · cuántos pacientes tiene cada profesional
--            · cuántos registraron al menos una noche y cuántos llegaron a 14
--            · cuántas noches tiene cada paciente y cuándo fue la última
--            · totales de plataforma
--
--  NO SE VE  · ninguna noche: ni horarios, ni latencia, ni despertares
--            · ningún comentario del paciente
--            · ninguna escala ni su puntaje
--            · nada que permita armar un actograma
--
--  Las funciones son SECURITY DEFINER —corren con permisos elevados— pero
--  devuelven solo agregados, y cada una arranca con un `where es_admin()`:
--  si el que llama no está en app_admins, no devuelven ni una fila.
--
--  Esto NO agrega ninguna policy de SELECT sobre sleep_diary, evaluations
--  ni patients. Las reglas de acceso quedan exactamente como están.
