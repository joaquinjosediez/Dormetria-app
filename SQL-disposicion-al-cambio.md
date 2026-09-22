# Disposición al cambio · guardarla para el profesional

Hoy las dos reglas de importancia y confianza se guardan **en el dispositivo**
(`localStorage`). Alcanza para ajustar lo que el programa le dice al paciente,
pero el profesional no las ve, y ahí es donde valen: alguien que llega con
confianza 3 necesita otra conversación que alguien que llega con 9.

Esto lo agrega. Correr en Supabase → SQL Editor.

```sql
-- Dos reglas, no una. En entrevista motivacional (Rollnick) importancia y
-- confianza son construcciones distintas y piden intervenciones opuestas:
--   importancia baja → trabajar el porqué
--   confianza baja   → achicar el primer paso
-- Guardarlas juntas en un solo número pierde exactamente eso.
create table if not exists public.tcci_disposicion (
  id            uuid primary key default gen_random_uuid(),
  patient_email text not null,
  creado_en     timestamptz not null default now(),
  importancia   int  check (importancia between 1 and 10),
  confianza     int  check (confianza  between 1 and 10),
  porque        text
);

-- Se mide más de una vez a propósito: lo interesante no es el valor inicial
-- sino si se movió. Por eso no hay unique sobre patient_email.
create index if not exists tcci_disposicion_pac_idx
  on public.tcci_disposicion (patient_email, creado_en desc);

alter table public.tcci_disposicion enable row level security;

-- El paciente escribe y lee lo suyo.
drop policy if exists disp_paciente_escribe on public.tcci_disposicion;
create policy disp_paciente_escribe on public.tcci_disposicion
  for insert to authenticated
  with check (lower(patient_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists disp_paciente_lee on public.tcci_disposicion;
create policy disp_paciente_lee on public.tcci_disposicion
  for select to authenticated
  using (lower(patient_email) = lower(auth.jwt() ->> 'email'));

-- El profesional lee la de SUS pacientes, y solo la de ellos. La pertenencia
-- se prueba contra doctor_patients, igual que el resto de la app.
drop policy if exists disp_profesional_lee on public.tcci_disposicion;
create policy disp_profesional_lee on public.tcci_disposicion
  for select to authenticated
  using (exists (
    select 1 from public.doctor_patients dp
    where lower(dp.patient_email) = lower(tcci_disposicion.patient_email)
      and lower(dp.doctor_email)  = lower(auth.jwt() ->> 'email')
  ));

-- Sin policy de update ni de delete: una medición no se corrige, se vuelve a
-- tomar. Si se pudiera editar, la serie dejaría de significar algo.
```

## Después de correrlo

```sql
-- Tiene que devolver 0 filas: nadie con acceso a una disposición de alguien
-- que no es su paciente.
select d.patient_email
from public.tcci_disposicion d
where not exists (
  select 1 from public.patients p
  where lower(p.email) = lower(d.patient_email)
)
limit 20;
```

Avisame cuando esté y engancho la escritura a la tabla, dejo la lectura en la
ficha del paciente y agrego la re-toma en la semana 4 — que es lo que permite
ver si la confianza se movió, que clínicamente es más interesante que el valor
de entrada.
