-- ════════════════════════════════════════════════════════════════════
--  Por qué los pacientes de Ruffa figuran "inactivos"
--
--  No están inactivos. Tu cuenta no puede leer sus diarios.
--
--  Las policies de sleep_diary dejan leer una fila a:
--    · el propio paciente, y
--    · el profesional vinculado a ese paciente.
--  El administrador no es ninguno de los dos para los pacientes de otro
--  colega, así que esas filas simplemente no vuelven. Desde el panel eso se
--  ve idéntico a "no registró nada": una lista vacía.
--
--  Desde mod203 la app lo detecta sola —le pregunta al servidor cuántas
--  filas hay y compara con cuántas pudo leer— y avisa en rojo en vez de
--  mostrar ceros. Pero el arreglo de fondo es este.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Confirmar el diagnóstico antes de tocar nada ──────────────────
-- Corré esto con tu usuario. Si el total es mucho mayor que lo que ves en
-- el panel, es esto.
select count(*) as noches_totales from public.sleep_diary;

-- Y las policies que hay hoy:
select policyname, cmd, permissive, roles, qual
from   pg_policies
where  schemaname = 'public' and tablename = 'sleep_diary'
order  by cmd, policyname;

-- ── 2. Quién es administrador ────────────────────────────────────────
-- Hoy "ser admin" se decide del lado del cliente. Para la base no existe,
-- y por eso no hay forma de escribir una policy que lo contemple. Se crea
-- una tabla mínima: una fila por administrador.
create table if not exists public.app_admins (
  email      text primary key,
  creado_en  timestamptz not null default now(),
  nota       text
);

alter table public.app_admins enable row level security;

-- Nadie puede leer ni escribir esta tabla desde la app. Se administra solo
-- desde el panel de Supabase. Si se pudiera escribir desde el cliente,
-- cualquiera se haría administrador y se llevaría toda la base.
-- (Sin ninguna policy y con RLS activo, el acceso queda cerrado.)

insert into public.app_admins (email, nota)
values ('drjoaquindiez@gmail.com', 'Titular del proyecto')
on conflict (email) do nothing;

-- Función de apoyo: ¿el que está pidiendo es administrador?
-- SECURITY DEFINER para que pueda mirar app_admins aunque la RLS de esa
-- tabla esté cerrada para todos.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to authenticated;

-- ── 3. Lectura para el administrador ─────────────────────────────────
-- SOLO LECTURA, y solo en las tablas que alimentan el panel. Nada de
-- escribir ni borrar: un panel de métricas no necesita modificar nada, y
-- una policy de escritura acá sería un agujero mucho más grande que el
-- problema que resuelve.

drop policy if exists admin_lee_diario on public.sleep_diary;
create policy admin_lee_diario on public.sleep_diary
  for select to authenticated
  using (public.es_admin());

drop policy if exists admin_lee_evaluaciones on public.evaluations;
create policy admin_lee_evaluaciones on public.evaluations
  for select to authenticated
  using (public.es_admin());

drop policy if exists admin_lee_pacientes on public.patients;
create policy admin_lee_pacientes on public.patients
  for select to authenticated
  using (public.es_admin());

drop policy if exists admin_lee_vinculos on public.doctor_patients;
create policy admin_lee_vinculos on public.doctor_patients
  for select to authenticated
  using (public.es_admin());

-- ── 4. Comprobación ──────────────────────────────────────────────────
-- Tiene que devolver true para vos.
select public.es_admin() as soy_admin;

-- Y esto, el total de noches por profesional. Si antes veías ceros en los
-- pacientes de Ruffa y ahora ves números, quedó arreglado.
select dp.doctor_email,
       count(distinct d.patient_email) as pacientes_con_registro,
       count(*)                        as noches
from   public.sleep_diary d
join   public.doctor_patients dp on lower(dp.patient_email) = lower(d.patient_email)
group  by dp.doctor_email
order  by noches desc;

-- ── Lo que esto NO hace, a propósito ─────────────────────────────────
-- · No le da al administrador permiso de escribir ni borrar.
-- · No le da a ningún profesional acceso a pacientes que no son suyos.
-- · No toca ninguna policy existente: se suman, no se reemplazan.
--
-- Y una consecuencia que conviene tener presente: a partir de acá el
-- administrador SÍ puede leer datos clínicos de pacientes de otros
-- profesionales. Es lo que hace falta para que el panel diga la verdad,
-- pero es un acceso real y bajo la Ley 25.326 conviene que esté
-- documentado en la política de privacidad — quién es administrador, a qué
-- accede y para qué.
