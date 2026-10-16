-- ═══════════════════════════════════════════════════════════════════
--  Dormetria · los OCHO pacientes de ejemplo, y nada más
--  Generado el 16/10/2026 · corregido tras tres errores en produccion
--
--  DEJA EL PANEL DE EJEMPLO COMO LO VA A VER UN COLEGA QUE SE REGISTRA
--  HOY. Borra los demás demos con sus registros, carga 8 semanas a cada
--  uno de los ocho y les pone las escalas que encienden su etiqueta.
--
--    JUANA1  Juana de Arco, 25    INSOMNIO        ISI 22
--    QUIJAN  Alonso Quijano, 58   SAHOS           STOP-BANG 6
--    KAHLO1  Frida Kahlo, 47      SPI             IRLS 24
--    FRANK1  V. Frankenstein, 41  PARASOMNIA      RBD-SQ 10
--    PETER1  Peter Pan, 17        CRONODISRUPCIÓN jet lag 189 min
--    AURORA  Aurora Bosque, 30    NARCOLEPSIA     a mano (ver §5)
--    ELENA1  Elena, 38            (ninguna)       el control
--            Tomás, 4, hijo de Elena              el pediátrico
--
--  CORRIDO DE VERDAD Y FALLADO TRES VECES. Lo que cambió en cada una,
--  por si aparece una cuarta:
--    1 · `limit 1` antes de `union all` sin paréntesis.
--    2 · `on conflict (email)` no cubre el unique de `code`.
--    3 · mood y energy iban de 1 a 10 y la columna acepta 1 a 5.
--  Ahora, antes de generar, se valida cada valor contra su rango y la
--  sintaxis contra el parser real de Postgres. De paso aparecieron 24
--  valores negativos de vigilia intrasueño que también habrían entrado.
--
--  SE PUEDE CORRER LAS VECES QUE QUIERAS. Correlo ENTERO y de una vez:
--  si se corta al medio, el begin/commit queda suelto.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1 · Nombres y códigos ──────────────────────────────────────────

-- Rip Van Winkle no lo conoce mucha gente, y en un video eso es un
-- segundo perdido explicando quién era.
update public.patients
   set name = 'Aurora', lname = 'Bosque', code = 'AURORA'
 where code = 'WINKLE'
   and not exists (select 1 from public.patients where code = 'AURORA');

update public.patients set code = 'ELENA1'
 where lower(name) = 'elena'
   and email like '%demo%'
   and code is distinct from 'ELENA1'
   and not exists (select 1 from public.patients where code = 'ELENA1');

-- Tomás es HIJO de Elena: lleva parent_email y el auth_id de la madre,
-- que es lo que la RLS de sleep_diary mira. Sin auth_id la ficha nace
-- huérfana y no la puede leer nadie.
--
-- Va en dos pasos y no con `on conflict`, porque hay DOS restricciones
-- únicas —email y code— y `on conflict` sólo puede atender una.
update public.patients t
   set parent_email = e.email, auth_id = e.auth_id,
       name = 'Tomás', lname = 'Ferrante', dob = date '2022-05-10', sex = 'M',
       caregiver_relation = 'madre', schooled = false, is_demo = true
  from public.patients e
 where t.code = 'TOMAS1' and e.code = 'ELENA1';

insert into public.patients (email, name, lname, dob, sex, code, parent_email,
                             caregiver_relation, auth_id, schooled, is_demo)
select e.email || '+tomas@child', 'Tomás', 'Ferrante', date '2022-05-10', 'M',
       'TOMAS1', e.email, 'madre', e.auth_id, false, true
  from public.patients e
 where e.code = 'ELENA1'
   and not exists (select 1 from public.patients where code = 'TOMAS1')
   and not exists (select 1 from public.patients
                    where email = e.email || '+tomas@child');

-- ── 2 · Fuera los demás pacientes de ejemplo ───────────────────────
-- Son ficticios: se borran con todos sus registros. El filtro mira SOLO
-- el dominio demo o is_demo y excluye a los ocho, así que no puede
-- alcanzar a un paciente real.
--
-- Tabla por tabla ANTES de la ficha: si alguna tiene clave foránea
-- contra patients, el delete falla y el script se corta a la mitad, que
-- es peor que no correrlo.

with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.sleep_diary where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.evaluations where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.doctor_patients where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.doctor_alerts where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.doctor_suggestions where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.cbti_patients where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.cbti_progress where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.ai_reports where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.patient_documents where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.patient_education where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.pvt_tests where patient_email in (select email from sobran);
with sobran as (
  select email from public.patients
   where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
)
delete from public.consultation_notes where patient_email in (select email from sobran);

delete from public.patients
 where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1');

update public.patients set is_demo = true where code in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1');

-- ── 3 · Ocho semanas de diario ─────────────────────────────────────
begin;

with gente as (
  (select 'juana'::text as k, email from public.patients where code = 'JUANA1' limit 1)
  union all (select 'quijano'::text as k, email from public.patients where code = 'QUIJAN' limit 1)
  union all (select 'kahlo'::text as k, email from public.patients where code = 'KAHLO1' limit 1)
  union all (select 'frank'::text as k, email from public.patients where code = 'FRANK1' limit 1)
  union all (select 'peter'::text as k, email from public.patients where code = 'PETER1' limit 1)
  union all (select 'winkle'::text as k, email from public.patients where code = 'AURORA' limit 1)
  union all (select 'elena'::text as k, email from public.patients where code = 'ELENA1' limit 1)
  union all (select 'tomas'::text as k, email from public.patients where code = 'TOMAS1' limit 1)
)
delete from public.sleep_diary s using gente g
 where s.patient_email = g.email
   and s.diary_date between date '2026-08-21' and date '2026-10-15';

with gente as (
  (select 'juana'::text as k, email from public.patients where code = 'JUANA1' limit 1)
  union all (select 'quijano'::text as k, email from public.patients where code = 'QUIJAN' limit 1)
  union all (select 'kahlo'::text as k, email from public.patients where code = 'KAHLO1' limit 1)
  union all (select 'frank'::text as k, email from public.patients where code = 'FRANK1' limit 1)
  union all (select 'peter'::text as k, email from public.patients where code = 'PETER1' limit 1)
  union all (select 'winkle'::text as k, email from public.patients where code = 'AURORA' limit 1)
  union all (select 'elena'::text as k, email from public.patients where code = 'ELENA1' limit 1)
  union all (select 'tomas'::text as k, email from public.patients where code = 'TOMAS1' limit 1)
),
d (k, diary_date, bedtime, wake_time, get_up_time, sleep_minutes, sleep_latency_mins,
   awakenings, wake_in_bed_mins, awake_in_bed_after_mins, nap_minutes, sleep_quality,
   mood, energy, day_type, coffee_cups, last_caffeine_time, alcohol_drinks,
   last_alcohol_time, screen_minutes, exercise_mins, medications, notes, schema_version) as (
  values
  ('juana', '2026-08-21', '23:52', '07:13', '07:48', 343, 92, 1, 8, 34, 0, 1, 3, 3, 'work', 4, '20:18', 0, null, 99, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-08-22', '03:22', '11:54', '12:15', 434, 64, 0, 0, 21, 0, 3, 5, 5, 'free', 3, '11:38', 0, null, 87, 60, '[]'::jsonb, null, 2),
  ('juana', '2026-08-23', '02:50', '12:29', '12:58', 507, 69, 1, 3, 29, 0, 3, 3, 5, 'free', 1, '11:46', 0, null, 58, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-08-24', '23:58', '09:38', '10:04', 451, 118, 1, 10, 26, 45, 2, 3, 3, 'work', 1, '20:41', 0, null, 55, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-08-25', '01:39', '08:42', '09:02', 312, 87, 0, 0, 19, 0, 2, 3, 3, 'work', 1, '20:27', 0, null, 44, 33, '[]'::jsonb, null, 2),
  ('juana', '2026-08-26', '00:27', '08:59', '09:35', 392, 106, 0, 0, 36, 15, 2, 4, 4, 'work', 4, '20:08', 0, null, 50, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-08-27', '01:01', '09:50', '10:08', 416, 105, 0, 0, 17, 0, 2, 3, 3, 'work', 4, '20:52', 0, null, 81, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-08-28', '00:43', '07:18', '07:31', 334, 62, 0, 0, 13, 0, 2, 4, 4, 'work', 3, '11:46', 0, null, 106, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-08-29', '02:45', '10:34', '10:55', 383, 82, 0, 0, 21, 0, 2, 4, 4, 'free', 5, '20:52', 0, null, 92, 43, '[]'::jsonb, null, 2),
  ('juana', '2026-08-30', '01:41', '09:45', '10:10', 382, 96, 2, 6, 25, 0, 3, 3, 5, 'free', 4, '20:28', 0, null, 86, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-08-31', '00:20', '08:10', '08:38', 419, 41, 1, 9, 29, 0, 4, 4, 4, 'work', 4, '11:03', 0, null, 52, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-01', '00:55', '09:12', '09:41', 383, 104, 0, 0, 29, 0, 2, 4, 3, 'work', 2, '20:06', 0, null, 73, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-02', '00:31', '07:24', '08:04', 331, 69, 0, 0, 40, 0, 4, 4, 4, 'work', 3, '11:03', 0, null, 80, 44, '[]'::jsonb, null, 2),
  ('juana', '2026-09-03', '01:07', '09:26', '09:48', 390, 101, 1, 9, 22, 0, 1, 2, 2, 'work', 4, '20:56', 0, null, 80, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-04', '00:22', '07:35', '08:01', 361, 69, 0, 0, 26, 0, 2, 5, 4, 'work', 3, '20:47', 0, null, 95, 63, '[]'::jsonb, null, 2),
  ('juana', '2026-09-05', '01:23', '09:35', '09:46', 373, 98, 1, 21, 11, 0, 2, 3, 3, 'free', 3, '20:34', 0, null, 79, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-06', '02:57', '11:14', '11:36', 411, 75, 0, 0, 22, 0, 2, 3, 3, 'free', 2, '20:17', 0, null, 20, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-07', '00:59', '07:07', '07:30', 270, 78, 1, 21, 23, 0, 3, 3, 3, 'work', 2, '20:35', 0, null, 63, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-08', '01:22', '09:07', '09:17', 368, 77, 0, 0, 10, 0, 1, 2, 2, 'work', 3, '20:10', 0, null, 81, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-09', '00:58', '09:12', '09:29', 427, 73, 1, 0, 17, 39, 1, 2, 2, 'work', 2, '20:03', 0, null, 57, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-10', '00:43', '08:27', '08:59', 350, 105, 0, 0, 31, 0, 2, 5, 4, 'work', 3, '20:49', 0, null, 59, 32, '[]'::jsonb, null, 2),
  ('juana', '2026-09-11', '00:20', '08:34', '09:02', 422, 59, 0, 0, 28, 11, 1, 2, 2, 'work', 3, '20:50', 0, null, 97, 32, '[]'::jsonb, null, 2),
  ('juana', '2026-09-12', '01:25', '10:04', '10:33', 443, 62, 0, 0, 29, 0, 3, 3, 3, 'free', 3, '11:10', 0, null, 72, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-13', '01:18', '08:40', '09:08', 333, 89, 0, 0, 28, 49, 2, 5, 5, 'free', 2, '11:36', 0, null, 113, 55, '[]'::jsonb, null, 2),
  ('juana', '2026-09-14', '00:20', '09:19', '09:32', 415, 98, 2, 25, 14, 38, 2, 4, 4, 'work', 2, '20:20', 0, null, 105, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-15', '23:49', '08:21', '08:40', 410, 88, 1, 14, 19, 0, 1, 2, 2, 'work', 3, '20:08', 0, null, 111, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-16', '01:17', '09:48', '10:24', 428, 67, 1, 17, 36, 0, 3, 4, 3, 'work', 5, '11:09', 0, null, 54, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-17', '01:10', '08:43', '08:52', 361, 81, 1, 11, 9, 0, 3, 5, 5, 'work', 4, '11:48', 0, null, 126, 38, '[]'::jsonb, null, 2),
  ('juana', '2026-09-18', '01:39', '09:28', '09:39', 370, 78, 1, 20, 11, 38, 2, 4, 4, 'work', 3, '20:12', 0, null, 121, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-19', '02:06', '09:30', '09:59', 364, 59, 0, 0, 29, 0, 2, 4, 4, 'free', 4, '11:44', 0, null, 22, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-20', '01:51', '09:44', '10:28', 364, 93, 0, 0, 44, 0, 1, 1, 1, 'free', 2, '20:18', 0, null, 125, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-21', '00:33', '09:38', '10:30', 433, 108, 0, 0, 53, 0, 1, 3, 3, 'work', 3, '20:14', 0, null, 100, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-22', '01:26', '09:48', '10:14', 422, 62, 1, 17, 26, 0, 3, 5, 5, 'work', 3, '11:31', 0, null, 105, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-23', '01:45', '09:25', '09:43', 350, 103, 1, 7, 17, 0, 2, 4, 4, 'work', 2, '20:50', 0, null, 67, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-24', '00:32', '07:31', '07:49', 351, 60, 2, 8, 18, 0, 3, 4, 4, 'work', 2, '11:25', 0, null, 71, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-25', '01:43', '08:33', '09:04', 343, 47, 0, 0, 31, 0, 2, 4, 4, 'work', 4, '11:50', 0, null, 142, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-26', '01:39', '11:16', '11:41', 484, 83, 0, 0, 25, 0, 3, 3, 3, 'free', 4, '11:28', 0, null, 92, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-27', '02:03', '10:35', '11:27', 413, 78, 0, 0, 52, 0, 2, 3, 3, 'free', 2, '20:21', 0, null, 122, 29, '[]'::jsonb, null, 2),
  ('juana', '2026-09-28', '23:30', '06:59', '07:18', 366, 63, 2, 19, 19, 46, 3, 4, 3, 'work', 6, '11:16', 0, null, 102, 52, '[]'::jsonb, null, 2),
  ('juana', '2026-09-29', '01:02', '10:20', '10:59', 467, 78, 0, 0, 39, 0, 2, 3, 3, 'work', 2, '20:43', 0, null, 136, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-09-30', '00:48', '07:54', '08:24', 329, 82, 1, 15, 29, 41, 3, 3, 3, 'work', 3, '11:17', 0, null, 66, 29, '[]'::jsonb, null, 2),
  ('juana', '2026-10-01', '01:04', '08:58', '09:04', 368, 108, 1, 0, 6, 46, 2, 5, 5, 'work', 4, '20:41', 0, null, 137, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-10-02', '23:37', '09:13', '09:23', 477, 77, 0, 0, 9, 45, 2, 4, 3, 'work', 4, '11:32', 0, null, 84, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-10-03', '01:33', '09:19', '09:43', 353, 78, 1, 35, 24, 0, 1, 3, 3, 'free', 3, '20:27', 0, null, 129, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-10-04', '01:20', '11:19', '11:54', 494, 100, 1, 5, 35, 26, 3, 4, 4, 'free', 4, '11:02', 0, null, 111, 40, '[]'::jsonb, null, 2),
  ('juana', '2026-10-05', '01:08', '08:21', '09:01', 344, 68, 1, 21, 40, 16, 3, 3, 3, 'work', 3, '11:47', 0, null, 113, 41, '[]'::jsonb, null, 2),
  ('juana', '2026-10-06', '00:33', '09:14', '09:53', 397, 123, 0, 0, 39, 0, 1, 3, 3, 'work', 4, '20:37', 0, null, 60, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-10-07', '00:06', '08:02', '08:15', 360, 99, 1, 17, 13, 48, 3, 4, 4, 'work', 3, '20:04', 0, null, 112, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-10-08', '01:35', '07:55', '08:27', 300, 62, 0, 0, 32, 0, 2, 5, 4, 'work', 4, '11:38', 0, null, 107, 45, '[]'::jsonb, null, 2),
  ('juana', '2026-10-09', '01:37', '08:05', '08:47', 323, 43, 2, 23, 42, 0, 2, 3, 3, 'work', 4, '11:23', 0, null, 93, 49, '[]'::jsonb, null, 2),
  ('juana', '2026-10-10', '01:06', '08:37', '09:05', 379, 61, 1, 11, 28, 0, 2, 4, 3, 'free', 3, '11:52', 0, null, 161, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-10-11', '03:02', '11:36', '11:56', 424, 69, 2, 21, 20, 17, 2, 3, 3, 'free', 3, '20:11', 0, null, 133, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-10-12', '00:18', '07:15', '07:22', 356, 50, 0, 0, 7, 53, 1, 2, 2, 'work', 3, '11:29', 0, null, 87, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-10-13', '00:32', '08:19', '08:28', 364, 86, 1, 16, 9, 0, 2, 4, 4, 'work', 3, '20:45', 0, null, 110, 0, '[]'::jsonb, null, 2),
  ('juana', '2026-10-14', '00:34', '09:25', '09:45', 436, 79, 0, 0, 19, 27, 2, 3, 3, 'work', 3, '20:29', 0, null, 53, 54, '[]'::jsonb, null, 2),
  ('juana', '2026-10-15', '01:05', '09:03', '09:39', 376, 91, 1, 11, 35, 0, 1, 3, 3, 'work', 1, '20:19', 0, null, 25, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-21', '23:32', '06:53', '07:11', 335, 12, 4, 93, 19, 9, 2, 4, 4, 'work', 1, '09:30', 4, '22:01', 27, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-22', '00:10', '06:24', '06:45', 333, 18, 5, 24, 21, 0, 1, 3, 2, 'free', 1, '09:30', 4, '22:48', 34, 40, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-23', '23:14', '05:33', '05:38', 271, 15, 5, 92, 5, 0, 1, 2, 2, 'free', 3, '09:30', 3, '22:40', 72, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-24', '23:12', '05:20', '05:45', 315, 13, 2, 41, 25, 0, 2, 3, 3, 'work', 1, '09:30', 0, null, 35, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-25', '23:17', '06:26', '06:30', 289, 19, 3, 121, 4, 62, 2, 4, 4, 'work', 2, '09:30', 3, '22:04', 56, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-26', '23:03', '04:42', '04:49', 268, 17, 6, 54, 8, 0, 2, 3, 3, 'work', 3, '09:30', 2, '22:49', 70, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-27', '23:15', '07:43', '07:51', 427, 19, 4, 62, 8, 0, 2, 4, 3, 'work', 2, '09:30', 0, null, 8, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-28', '22:23', '04:11', '04:18', 286, 16, 3, 46, 8, 0, 2, 5, 5, 'work', 2, '09:30', 0, null, 73, 37, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-29', '00:15', '07:04', '07:00', 364, 6, 3, 39, 0, 23, 2, 4, 3, 'free', 1, '09:30', 0, null, 69, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-30', '23:47', '06:27', '06:36', 341, 16, 5, 44, 9, 0, 2, 3, 3, 'free', 3, '09:30', 3, '22:39', 58, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-08-31', '22:33', '05:17', '05:38', 333, 18, 6, 53, 21, 0, 1, 2, 2, 'work', 0, '09:30', 3, '22:55', 38, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-01', '22:46', '06:15', '06:40', 378, 14, 2, 57, 24, 0, 1, 3, 3, 'work', 1, '09:30', 0, null, 24, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-02', '23:09', '07:43', '07:48', 448, 10, 2, 56, 5, 34, 2, 4, 4, 'work', 3, '09:30', 0, null, 58, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-03', '23:34', '07:41', '07:58', 379, 21, 4, 87, 17, 0, 3, 3, 5, 'work', 0, '09:30', 3, '22:47', 33, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-04', '23:16', '05:50', '05:56', 320, 14, 5, 60, 7, 0, 1, 3, 2, 'work', 2, '09:30', 3, '22:41', 67, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-05', '23:34', '07:31', '07:39', 383, 14, 6, 80, 8, 47, 1, 2, 2, 'free', 2, '09:30', 2, '22:43', 18, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-06', '23:51', '07:50', '08:12', 389, 14, 3, 76, 21, 0, 2, 4, 4, 'free', 1, '09:30', 0, null, 66, 43, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-07', '23:13', '05:35', '05:47', 287, 10, 4, 85, 11, 51, 1, 2, 2, 'work', 2, '09:30', 3, '22:32', 46, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-08', '22:41', '05:40', '06:05', 342, 25, 4, 52, 25, 0, 2, 5, 4, 'work', 1, '09:30', 2, '22:08', 37, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-09', '22:19', '05:58', '06:23', 409, 20, 2, 31, 25, 0, 3, 5, 5, 'work', 2, '09:30', 0, null, 56, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-10', '23:43', '06:21', '06:36', 362, 2, 3, 38, 14, 51, 2, 4, 3, 'work', 1, '09:30', 0, null, 26, 42, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-11', '23:27', '05:48', '05:57', 308, 13, 2, 60, 8, 0, 3, 5, 5, 'work', 1, '09:30', 0, null, 21, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-12', '00:04', '06:39', '07:05', 340, 17, 5, 39, 26, 0, 2, 5, 4, 'free', 2, '09:30', 0, null, 42, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-13', '23:54', '06:33', '06:47', 316, 24, 4, 59, 14, 0, 2, 4, 4, 'free', 2, '09:30', 1, '22:03', 39, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-14', '22:39', '04:14', '04:35', 285, 2, 5, 52, 20, 0, 1, 2, 2, 'work', 3, '09:30', 2, '22:33', 53, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-15', '22:33', '05:47', '05:55', 366, 10, 4, 58, 8, 0, 1, 2, 2, 'work', 4, '09:30', 3, '22:53', 12, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-16', '23:37', '06:09', '06:23', 378, 8, 4, 7, 14, 0, 2, 4, 4, 'work', 1, '09:30', 0, null, 33, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-17', '23:01', '06:19', '06:40', 371, 14, 2, 53, 21, 20, 3, 3, 3, 'work', 3, '09:30', 0, null, 25, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-18', '23:37', '06:42', '06:56', 313, 20, 4, 92, 14, 63, 2, 3, 3, 'work', 3, '09:30', 3, '22:23', 60, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-19', '23:26', '05:28', '05:38', 256, 17, 4, 88, 10, 0, 3, 5, 5, 'free', 2, '09:30', 3, '22:57', 15, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-20', '23:37', '08:22', '08:33', 438, 5, 5, 82, 11, 31, 1, 1, 1, 'free', 1, '09:30', 2, '22:11', 62, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-21', '23:32', '07:07', '07:24', 338, 9, 5, 108, 17, 0, 2, 5, 5, 'work', 4, '09:30', 1, '22:49', 59, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-22', '23:31', '07:57', '08:08', 400, 12, 3, 95, 11, 0, 1, 3, 3, 'work', 3, '09:30', 2, '22:42', 38, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-23', '00:40', '07:09', '07:11', 311, 25, 4, 53, 2, 0, 3, 5, 5, 'work', 3, '09:30', 3, '22:51', 8, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-24', '23:37', '06:51', '07:12', 393, 9, 2, 31, 21, 60, 2, 4, 4, 'work', 1, '09:30', 0, null, 26, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-25', '22:42', '06:03', '06:13', 358, 20, 4, 63, 10, 17, 2, 4, 4, 'work', 0, '09:30', 5, '22:34', 42, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-26', '23:37', '08:07', '08:20', 432, 22, 2, 55, 13, 0, 3, 4, 4, 'free', 3, '09:30', 0, null, 42, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-27', '00:37', '07:50', '08:10', 364, 17, 3, 52, 20, 0, 3, 3, 5, 'free', 3, '09:30', 0, null, 36, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-28', '23:27', '08:01', '08:17', 460, 12, 1, 43, 16, 47, 2, 3, 3, 'work', 3, '09:30', 0, null, 48, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-29', '23:23', '07:06', '07:22', 412, 5, 4, 45, 16, 29, 1, 2, 2, 'work', 4, '09:30', 0, null, 31, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-09-30', '22:57', '05:11', '05:21', 323, 18, 4, 33, 10, 0, 2, 4, 4, 'work', 2, '09:30', 0, null, 36, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-01', '23:45', '07:11', '07:36', 362, 20, 3, 64, 25, 0, 1, 2, 2, 'work', 3, '09:30', 0, null, 40, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-02', '23:32', '05:54', '06:14', 307, 13, 3, 61, 21, 0, 2, 4, 4, 'work', 2, '09:30', 0, null, 66, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-03', '00:23', '07:25', '07:35', 359, 20, 2, 44, 10, 0, 2, 5, 4, 'free', 3, '09:30', 0, null, 36, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-04', '23:21', '06:15', '06:38', 302, 16, 5, 96, 22, 0, 2, 5, 4, 'free', 3, '09:30', 4, '22:09', 65, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-05', '23:30', '06:22', '06:44', 295, 18, 5, 99, 22, 0, 2, 4, 4, 'work', 3, '09:30', 4, '22:31', 12, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-06', '22:42', '06:00', '06:09', 355, 17, 3, 66, 9, 57, 2, 4, 3, 'work', 2, '09:30', 2, '22:44', 48, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-07', '22:15', '05:40', '05:53', 365, 6, 4, 74, 13, 31, 2, 3, 3, 'work', 2, '09:30', 5, '22:39', 5, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-08', '23:19', '05:10', '05:27', 312, 8, 3, 31, 16, 43, 2, 4, 4, 'work', 3, '09:30', 0, null, 54, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-09', '23:00', '06:43', '07:04', 419, 8, 3, 36, 21, 0, 4, 4, 4, 'work', 3, '09:30', 0, null, 47, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-10', '23:52', '06:42', '06:52', 281, 24, 4, 106, 10, 42, 2, 4, 4, 'free', 2, '09:30', 4, '22:16', 21, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-11', '00:29', '07:45', '08:07', 343, 7, 3, 85, 21, 0, 2, 3, 3, 'free', 2, '09:30', 2, '22:14', 11, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-12', '22:27', '04:27', '04:37', 267, 17, 7, 76, 10, 0, 2, 5, 4, 'work', 1, '09:30', 3, '22:21', 44, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-13', '22:55', '07:43', '08:10', 439, 23, 2, 67, 27, 0, 2, 5, 5, 'work', 3, '09:30', 0, null, 37, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-14', '22:37', '06:16', '06:18', 349, 18, 4, 92, 2, 0, 1, 3, 3, 'work', 2, '09:30', 4, '22:32', 33, 0, '[]'::jsonb, null, 2),
  ('quijano', '2026-10-15', '23:07', '05:26', '05:38', 268, 18, 6, 93, 12, 0, 2, 4, 4, 'work', 3, '09:30', 4, '22:31', 45, 44, '[]'::jsonb, null, 2),
  ('kahlo', '2026-08-21', '23:39', '08:23', '08:50', 373, 70, 4, 80, 27, 92, 1, 3, 3, 'work', 0, '10:00', 0, null, 33, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-08-22', '01:00', '07:45', '07:56', 284, 46, 4, 75, 11, 0, 2, 4, 3, 'free', 1, '10:00', 0, null, 41, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-08-23', '00:41', '10:26', '10:40', 414, 54, 3, 117, 14, 74, 2, 5, 4, 'free', 1, '10:00', 0, null, 34, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-08-24', '22:46', '05:30', '06:00', 311, 56, 4, 37, 30, 0, 3, 3, 5, 'work', 0, '10:00', 0, null, 0, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-08-25', '23:29', '05:47', '06:10', 289, 54, 2, 36, 22, 97, 2, 4, 4, 'work', 1, '10:00', 0, null, 42, 14, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-08-26', '23:09', '06:24', '06:51', 290, 40, 3, 105, 27, 102, 2, 5, 5, 'work', 1, '10:00', 0, null, 20, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-08-27', '00:05', '07:51', '08:15', 314, 64, 4, 87, 24, 66, 2, 3, 3, 'work', 2, '10:00', 0, null, 39, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-08-28', '00:06', '08:01', '08:28', 348, 74, 5, 53, 27, 0, 1, 3, 3, 'work', 1, '10:00', 0, null, 44, 17, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-08-29', '00:20', '09:32', '09:51', 390, 43, 3, 119, 19, 0, 1, 2, 2, 'free', 1, '10:00', 0, null, 15, 0, '[]'::jsonb, null, 2),
  ('kahlo', '2026-08-30', '00:09', '06:32', '06:51', 254, 43, 4, 86, 19, 74, 1, 3, 3, 'free', 0, '10:00', 0, null, 43, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-08-31', '00:09', '07:38', '07:47', 342, 44, 3, 62, 9, 82, 1, 1, 1, 'work', 2, '10:00', 0, null, 51, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-01', '23:08', '06:57', '07:15', 364, 43, 4, 62, 18, 0, 1, 1, 1, 'work', 2, '10:00', 0, null, 37, 44, '[]'::jsonb, null, 2),
  ('kahlo', '2026-09-02', '23:09', '04:34', '04:42', 231, 47, 2, 47, 7, 60, 2, 3, 3, 'work', 1, '10:00', 0, null, 33, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-03', '23:50', '08:44', '09:16', 408, 52, 5, 75, 32, 0, 3, 3, 3, 'work', 1, '10:00', 0, null, 42, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-04', '23:30', '08:05', '08:08', 408, 48, 4, 59, 3, 60, 1, 1, 1, 'work', 1, '10:00', 0, null, 12, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-05', '00:53', '08:30', '08:49', 336, 51, 3, 70, 19, 0, 1, 2, 2, 'free', 0, '10:00', 0, null, 21, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-06', '23:37', '08:25', '08:42', 358, 86, 4, 84, 17, 73, 3, 4, 3, 'free', 1, '10:00', 0, null, 35, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-07', '23:46', '07:06', '07:23', 274, 60, 2, 107, 17, 0, 3, 5, 5, 'work', 2, '10:00', 0, null, 46, 0, '[]'::jsonb, null, 2),
  ('kahlo', '2026-09-08', '23:49', '08:29', '08:59', 348, 104, 3, 68, 30, 0, 3, 5, 5, 'work', 3, '10:00', 0, null, 62, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-09', '23:38', '08:45', '09:16', 338, 109, 5, 99, 32, 0, 2, 4, 4, 'work', 1, '10:00', 0, null, 33, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-10', '00:01', '07:39', '08:02', 311, 78, 1, 69, 24, 95, 1, 3, 3, 'work', 0, '10:00', 0, null, 22, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-11', '23:22', '06:24', '06:35', 321, 38, 4, 63, 10, 0, 3, 5, 5, 'work', 1, '10:00', 0, null, 31, 24, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-12', '00:27', '07:49', '08:16', 337, 25, 1, 79, 28, 40, 1, 3, 2, 'free', 0, '10:00', 0, null, 45, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-13', '23:56', '07:15', '07:38', 280, 93, 3, 65, 23, 91, 2, 4, 4, 'free', 2, '10:00', 0, null, 39, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-14', '00:16', '08:49', '09:07', 330, 39, 3, 145, 17, 57, 2, 5, 4, 'work', 1, '10:00', 0, null, 26, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-15', '23:33', '07:23', '07:52', 347, 38, 4, 85, 29, 38, 1, 2, 2, 'work', 0, '10:00', 0, null, 35, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-16', '00:15', '10:09', '10:30', 439, 96, 6, 58, 21, 55, 1, 2, 2, 'work', 1, '10:00', 0, null, 42, 23, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-17', '22:41', '06:04', '06:36', 329, 60, 4, 54, 33, 0, 1, 3, 3, 'work', 1, '10:00', 0, null, 15, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-18', '23:45', '05:28', '05:38', 215, 63, 2, 66, 10, 0, 1, 3, 3, 'work', 1, '10:00', 0, null, 13, 0, '[]'::jsonb, null, 2),
  ('kahlo', '2026-09-19', '23:16', '06:40', '06:56', 333, 8, 4, 103, 17, 47, 2, 4, 4, 'free', 3, '10:00', 0, null, 4, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-20', '23:44', '08:04', '08:22', 351, 33, 4, 116, 18, 73, 3, 5, 5, 'free', 0, '10:00', 0, null, 42, 0, '[]'::jsonb, null, 2),
  ('kahlo', '2026-09-21', '23:46', '06:33', '06:39', 288, 55, 5, 64, 6, 0, 2, 3, 3, 'work', 2, '10:00', 0, null, 18, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-22', '00:04', '07:53', '08:22', 330, 79, 2, 61, 30, 0, 4, 4, 4, 'work', 2, '10:00', 0, null, 53, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-23', '23:08', '08:54', '09:21', 481, 11, 4, 93, 27, 0, 1, 3, 3, 'work', 0, '10:00', 0, null, 0, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-24', '23:21', '08:42', '08:58', 414, 70, 3, 77, 16, 82, 2, 5, 4, 'work', 2, '10:00', 0, null, 32, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-25', '00:00', '06:36', '06:33', 279, 80, 4, 38, 0, 48, 1, 1, 1, 'work', 1, '10:00', 0, null, 0, 0, '[]'::jsonb, null, 2),
  ('kahlo', '2026-09-26', '00:47', '08:38', '09:05', 386, 49, 3, 36, 27, 67, 3, 5, 5, 'free', 2, '10:00', 0, null, 7, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-27', '00:35', '09:10', '09:40', 395, 66, 5, 53, 30, 0, 1, 2, 2, 'free', 1, '10:00', 0, null, 0, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-28', '23:41', '08:04', '08:50', 325, 83, 5, 96, 46, 0, 2, 4, 4, 'work', 2, '10:00', 0, null, 34, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-29', '00:31', '08:05', '08:16', 376, 12, 3, 66, 12, 0, 3, 5, 5, 'work', 2, '10:00', 0, null, 36, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-09-30', '23:03', '07:10', '07:34', 412, 29, 4, 45, 25, 64, 2, 4, 4, 'work', 1, '10:00', 0, null, 39, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-01', '00:10', '06:42', '07:06', 255, 62, 4, 75, 25, 89, 2, 3, 3, 'work', 2, '10:00', 0, null, 49, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-02', '00:01', '05:31', '05:53', 257, 25, 2, 49, 21, 50, 1, 3, 3, 'work', 1, '10:00', 0, null, 36, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-03', '00:10', '09:10', '09:27', 387, 61, 4, 92, 17, 0, 1, 3, 2, 'free', 2, '10:00', 0, null, 28, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-04', '00:28', '08:15', '08:35', 367, 37, 2, 63, 20, 0, 2, 5, 5, 'free', 2, '10:00', 0, null, 44, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-05', '23:14', '08:10', '08:19', 350, 83, 3, 103, 9, 90, 2, 4, 3, 'work', 1, '10:00', 0, null, 11, 21, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-06', '00:14', '07:47', '08:14', 371, 54, 4, 28, 27, 0, 2, 4, 4, 'work', 2, '10:00', 0, null, 0, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-07', '23:47', '08:04', '08:21', 317, 67, 3, 113, 17, 52, 4, 4, 4, 'work', 1, '10:00', 0, null, 23, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-08', '22:54', '04:16', '04:24', 205, 65, 3, 53, 8, 0, 3, 3, 5, 'work', 2, '10:00', 0, null, 11, 0, '[]'::jsonb, null, 2),
  ('kahlo', '2026-10-09', '23:12', '07:15', '07:44', 299, 80, 4, 104, 29, 0, 1, 3, 2, 'work', 1, '10:00', 0, null, 24, 0, '[]'::jsonb, null, 2),
  ('kahlo', '2026-10-10', '00:09', '07:22', '07:42', 344, 40, 1, 50, 20, 0, 2, 4, 4, 'free', 1, '10:00', 0, null, 29, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-11', '23:32', '05:57', '06:12', 273, 56, 3, 56, 14, 92, 2, 4, 4, 'free', 2, '10:00', 0, null, 62, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-12', '23:37', '06:07', '06:23', 306, 27, 4, 57, 16, 105, 1, 2, 2, 'work', 0, '10:00', 0, null, 43, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-13', '23:49', '08:34', '08:54', 346, 95, 4, 84, 20, 58, 1, 2, 2, 'work', 1, '10:00', 0, null, 51, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('kahlo', '2026-10-14', '23:12', '05:54', '06:10', 288, 57, 6, 57, 16, 70, 2, 3, 3, 'work', 1, '10:00', 0, null, 66, 0, '[]'::jsonb, null, 2),
  ('kahlo', '2026-10-15', '23:29', '07:28', '07:38', 326, 50, 1, 103, 10, 58, 2, 5, 4, 'work', 2, '10:00', 0, null, 39, 0, '[{"name": "Pregabalina", "dose": "75 mg"}]'::jsonb, null, 2),
  ('frank', '2026-08-21', '23:17', '06:56', '07:18', 331, 31, 1, 97, 21, 0, 2, 4, 4, 'work', 1, '16:00', 3, '23:03', 57, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-08-22', '01:54', '08:05', '08:15', 257, 34, 3, 80, 10, 18, 2, 4, 4, 'free', 2, '16:00', 3, '23:10', 74, 58, '[]'::jsonb, null, 2),
  ('frank', '2026-08-23', '02:43', '10:50', '11:02', 352, 43, 4, 93, 11, 20, 2, 4, 3, 'free', 2, '16:00', 4, '23:34', 85, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-08-24', '00:13', '05:40', '05:48', 227, 17, 3, 83, 8, 40, 2, 4, 4, 'work', 1, '16:00', 3, '23:29', 125, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-08-25', '00:45', '07:53', '08:08', 313, 45, 5, 70, 14, 17, 2, 4, 4, 'work', 2, '16:00', 2, '23:25', 36, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-08-26', '00:20', '07:45', '08:04', 402, 26, 2, 17, 19, 0, 2, 5, 4, 'work', 2, '16:00', 0, null, 123, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-08-27', '00:18', '08:47', '08:55', 382, 53, 2, 74, 8, 0, 3, 3, 3, 'work', 3, '16:00', 3, '23:00', 53, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-08-28', '01:22', '08:59', '09:07', 380, 19, 4, 57, 8, 17, 4, 4, 4, 'work', 2, '16:00', 0, null, 43, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-08-29', '00:50', '08:35', '08:54', 364, 15, 3, 85, 19, 0, 2, 4, 4, 'free', 2, '16:00', 4, '23:46', 48, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-08-30', '01:38', '08:06', '08:24', 331, 27, 1, 29, 18, 25, 3, 5, 5, 'free', 1, '16:00', 0, null, 89, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-08-31', '01:38', '10:23', '10:27', 397, 69, 2, 59, 4, 0, 3, 3, 5, 'work', 2, '16:00', 0, null, 29, 19, '[]'::jsonb, null, 2),
  ('frank', '2026-09-01', '00:36', '06:53', '07:10', 261, 23, 3, 93, 17, 32, 2, 4, 4, 'work', 2, '16:00', 5, '23:10', 47, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-02', '01:46', '09:03', '09:10', 301, 42, 4, 94, 6, 0, 2, 4, 4, 'work', 2, '16:00', 3, '23:54', 106, 37, '[]'::jsonb, null, 2),
  ('frank', '2026-09-03', '01:17', '09:18', '09:37', 364, 44, 3, 73, 19, 0, 3, 3, 5, 'work', 2, '16:00', 0, null, 85, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-04', '01:07', '08:23', '08:33', 361, 31, 1, 44, 10, 0, 3, 3, 3, 'work', 4, '16:00', 0, null, 93, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-05', '01:39', '08:43', '08:51', 326, 26, 4, 72, 8, 0, 2, 5, 4, 'free', 4, '16:00', 4, '23:29', 66, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-06', '02:13', '09:38', '09:44', 349, 13, 2, 83, 6, 0, 2, 4, 4, 'free', 3, '16:00', 3, '23:50', 76, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-07', '01:28', '07:22', '07:45', 328, 2, 4, 31, 23, 35, 2, 3, 3, 'work', 2, '16:00', 5, '23:27', 107, 26, '[]'::jsonb, null, 2),
  ('frank', '2026-09-08', '01:01', '07:19', '07:33', 310, 34, 3, 34, 13, 0, 2, 4, 4, 'work', 2, '16:00', 2, '23:23', 75, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-09', '01:02', '08:05', '08:19', 334, 20, 2, 70, 14, 0, 2, 5, 5, 'work', 1, '16:00', 0, null, 99, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-10', '00:57', '07:37', '07:52', 322, 35, 2, 43, 15, 0, 3, 3, 5, 'work', 2, '16:00', 2, '23:50', 32, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-11', '00:43', '08:14', '08:21', 357, 26, 3, 69, 7, 0, 1, 2, 2, 'work', 4, '16:00', 2, '23:24', 77, 52, '[]'::jsonb, null, 2),
  ('frank', '2026-09-12', '01:13', '07:45', '08:02', 295, 23, 3, 74, 17, 19, 2, 3, 3, 'free', 2, '16:00', 0, null, 69, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-13', '01:55', '09:25', '09:29', 352, 27, 3, 71, 4, 0, 3, 3, 5, 'free', 3, '16:00', 0, null, 79, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-14', '01:17', '08:52', '09:06', 375, 27, 2, 53, 13, 0, 2, 4, 4, 'work', 3, '16:00', 0, null, 64, 18, '[]'::jsonb, null, 2),
  ('frank', '2026-09-15', '00:48', '06:29', '06:38', 272, 25, 3, 43, 9, 25, 2, 4, 4, 'work', 2, '16:00', 4, '23:17', 77, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-16', '22:50', '07:45', '07:54', 406, 35, 2, 94, 10, 0, 2, 4, 4, 'work', 4, '16:00', 4, '23:02', 43, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-17', '00:47', '07:59', '08:16', 306, 32, 2, 94, 18, 0, 1, 1, 1, 'work', 3, '16:00', 2, '23:53', 35, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-18', '02:07', '09:27', '09:51', 361, 21, 3, 58, 24, 0, 3, 5, 5, 'work', 2, '16:00', 1, '23:27', 100, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-19', '02:03', '09:41', '10:02', 372, 40, 2, 46, 21, 0, 2, 5, 5, 'free', 3, '16:00', 0, null, 83, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-20', '02:34', '09:36', '09:48', 376, 16, 5, 31, 12, 0, 3, 3, 5, 'free', 2, '16:00', 0, null, 0, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-21', '01:04', '07:00', '07:18', 299, 19, 2, 38, 18, 0, 2, 4, 4, 'work', 0, '16:00', 0, null, 82, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-22', '00:09', '04:57', '05:09', 265, 10, 3, 13, 11, 0, 2, 4, 4, 'work', 4, '16:00', 0, null, 76, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-23', '01:39', '10:14', '10:26', 437, 28, 1, 50, 12, 0, 2, 4, 4, 'work', 4, '16:00', 0, null, 70, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-24', '01:17', '06:50', '06:48', 220, 35, 5, 79, 0, 32, 1, 1, 1, 'work', 2, '16:00', 0, '23:01', 86, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-25', '00:35', '06:22', '06:36', 267, 2, 4, 77, 14, 0, 3, 5, 5, 'work', 2, '16:00', 4, '23:54', 80, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-26', '02:14', '10:38', '10:32', 375, 38, 3, 91, 0, 0, 2, 4, 4, 'free', 2, '16:00', 3, '23:14', 38, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-27', '01:50', '09:49', '10:01', 358, 56, 3, 64, 12, 0, 2, 4, 4, 'free', 0, '16:00', 0, null, 71, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-28', '00:40', '08:18', '08:25', 371, 26, 2, 60, 7, 0, 1, 2, 2, 'work', 3, '16:00', 0, null, 69, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-29', '23:23', '06:50', '07:04', 340, 25, 3, 83, 14, 15, 2, 5, 5, 'work', 4, '16:00', 0, null, 111, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-09-30', '00:03', '07:15', '07:17', 339, 13, 2, 79, 2, 0, 2, 5, 4, 'work', 3, '16:00', 0, null, 55, 71, '[]'::jsonb, null, 2),
  ('frank', '2026-10-01', '00:56', '08:10', '08:25', 353, 7, 4, 74, 15, 0, 2, 5, 5, 'work', 3, '16:00', 4, '23:57', 48, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-02', '00:33', '06:57', '07:04', 296, 35, 2, 53, 7, 47, 2, 3, 3, 'work', 2, '16:00', 0, null, 41, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-03', '02:08', '07:41', '07:50', 257, 4, 2, 72, 10, 0, 2, 3, 3, 'free', 3, '16:00', 5, '23:45', 33, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-04', '02:46', '09:15', '09:30', 299, 13, 2, 78, 15, 0, 3, 5, 5, 'free', 3, '16:00', 2, '23:28', 95, 51, '[]'::jsonb, null, 2),
  ('frank', '2026-10-05', '23:29', '06:53', '06:53', 337, 40, 4, 67, 0, 0, 3, 4, 3, 'work', 3, '16:00', 3, '23:00', 116, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-06', '00:47', '08:46', '09:06', 385, 34, 3, 61, 20, 0, 2, 5, 5, 'work', 4, '16:00', 4, '23:40', 36, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-07', '01:51', '06:47', '07:02', 258, 24, 2, 14, 14, 0, 2, 4, 4, 'work', 2, '16:00', 0, null, 100, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-08', '00:34', '07:15', '07:27', 277, 35, 3, 89, 12, 0, 2, 4, 4, 'work', 3, '16:00', 2, '23:58', 84, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-09', '01:38', '08:51', '08:57', 381, 34, 1, 18, 6, 0, 2, 5, 5, 'work', 0, '16:00', 0, null, 72, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-10', '00:57', '07:17', '07:21', 257, 42, 3, 81, 4, 0, 2, 3, 3, 'free', 3, '16:00', 0, null, 111, 52, '[]'::jsonb, null, 2),
  ('frank', '2026-10-11', '01:51', '07:56', '07:54', 326, 13, 3, 26, 0, 0, 2, 5, 4, 'free', 2, '16:00', 2, '23:39', 117, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-12', '00:15', '06:27', '06:33', 277, 29, 5, 66, 6, 0, 2, 5, 4, 'work', 2, '16:00', 6, '23:40', 85, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-13', '01:46', '09:52', '10:02', 408, 24, 3, 53, 10, 0, 2, 4, 4, 'work', 3, '16:00', 3, '23:13', 50, 0, '[]'::jsonb, null, 2),
  ('frank', '2026-10-14', '00:33', '06:21', '06:34', 294, 26, 5, 29, 12, 21, 3, 5, 5, 'work', 2, '16:00', 2, '23:03', 49, 68, '[]'::jsonb, null, 2),
  ('frank', '2026-10-15', '01:40', '10:06', '10:10', 378, 34, 2, 93, 5, 0, 3, 4, 3, 'work', 0, '16:00', 2, '23:49', 59, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-08-21', '04:07', '10:46', '11:09', 351, 41, 1, 7, 23, 61, 3, 3, 5, 'work', 1, '17:30', 0, null, 159, 41, '[]'::jsonb, null, 2),
  ('peter', '2026-08-22', '05:16', '13:45', '13:58', 481, 24, 0, 0, 14, 0, 5, 4, 4, 'free', 3, '17:30', 0, null, 59, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-08-23', '06:15', '15:32', '15:42', 542, 13, 0, 0, 10, 0, 3, 5, 5, 'free', 1, '17:30', 0, null, 30, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-08-24', '02:31', '08:43', '09:03', 372, 2, 1, 10, 19, 75, 3, 3, 3, 'work', 1, '17:30', 0, null, 50, 43, '[]'::jsonb, null, 2),
  ('peter', '2026-08-25', '02:02', '08:02', '08:05', 320, 31, 0, 0, 3, 15, 3, 4, 3, 'work', 3, '17:30', 0, null, 81, 33, '[]'::jsonb, null, 2),
  ('peter', '2026-08-26', '02:12', '09:17', '09:36', 392, 33, 0, 0, 19, 0, 3, 3, 5, 'work', 2, '17:30', 0, null, 70, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-08-27', '02:03', '08:48', '08:42', 361, 39, 1, 5, 0, 0, 2, 3, 3, 'work', 3, '17:30', 0, null, 171, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-08-28', '02:43', '10:01', '10:01', 418, 18, 1, 2, 0, 0, 2, 4, 4, 'work', 1, '17:30', 0, null, 176, 64, '[]'::jsonb, null, 2),
  ('peter', '2026-08-29', '03:12', '10:42', '10:55', 426, 17, 1, 6, 13, 73, 3, 5, 5, 'free', 2, '17:30', 0, null, 49, 25, '[]'::jsonb, null, 2),
  ('peter', '2026-08-30', '05:36', '14:53', '15:18', 508, 35, 0, 0, 25, 0, 3, 3, 3, 'free', 0, '17:30', 0, null, 189, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-08-31', '02:28', '09:43', '10:02', 406, 18, 0, 0, 19, 0, 3, 5, 5, 'work', 2, '17:30', 0, null, 145, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-01', '01:48', '07:59', '08:08', 342, 19, 1, 10, 8, 0, 4, 4, 4, 'work', 1, '17:30', 0, null, 41, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-02', '01:51', '11:14', '11:37', 526, 22, 0, 0, 23, 33, 3, 5, 5, 'work', 1, '17:30', 0, null, 43, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-03', '02:25', '09:22', '09:29', 394, 31, 1, 0, 7, 0, 4, 4, 4, 'work', 3, '17:30', 0, null, 219, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-04', '02:12', '09:06', '09:08', 392, 17, 0, 0, 2, 0, 2, 5, 4, 'work', 1, '17:30', 0, null, 152, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-05', '05:54', '13:05', '13:22', 398, 25, 0, 0, 17, 0, 3, 4, 3, 'free', 4, '17:30', 0, null, 58, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-06', '04:26', '11:25', '11:48', 376, 32, 0, 0, 23, 0, 3, 3, 3, 'free', 3, '17:30', 0, null, 146, 32, '[]'::jsonb, null, 2),
  ('peter', '2026-09-07', '03:45', '12:22', '12:33', 475, 41, 0, 0, 11, 18, 3, 3, 3, 'work', 3, '17:30', 0, null, 168, 55, '[]'::jsonb, null, 2),
  ('peter', '2026-09-08', '03:57', '11:22', '11:33', 396, 38, 1, 12, 11, 111, 3, 3, 3, 'work', 2, '17:30', 0, null, 183, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-09', '02:50', '09:57', '10:10', 379, 28, 0, 0, 12, 80, 3, 3, 3, 'work', 3, '17:30', 0, null, 192, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-10', '00:32', '07:41', '07:55', 406, 16, 1, 8, 13, 0, 2, 4, 4, 'work', 2, '17:30', 0, null, 170, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-11', '01:09', '06:28', '06:37', 315, 8, 1, 0, 9, 0, 2, 4, 4, 'work', 2, '17:30', 0, null, 86, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-12', '06:31', '14:46', '15:13', 460, 31, 0, 0, 27, 43, 4, 4, 4, 'free', 1, '17:30', 0, null, 7, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-13', '05:03', '11:12', '11:34', 340, 26, 0, 0, 22, 0, 2, 4, 4, 'free', 2, '17:30', 0, null, 168, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-14', '02:25', '09:56', '10:01', 416, 37, 0, 0, 5, 0, 3, 4, 3, 'work', 2, '17:30', 0, null, 174, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-15', '02:47', '09:01', '09:12', 335, 28, 1, 11, 11, 0, 2, 5, 4, 'work', 3, '17:30', 0, null, 32, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-16', '01:26', '07:52', '08:14', 355, 16, 1, 15, 22, 0, 3, 3, 5, 'work', 1, '17:30', 0, null, 39, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-17', '02:01', '08:34', '08:40', 362, 26, 1, 4, 7, 0, 3, 4, 4, 'work', 2, '17:30', 0, null, 183, 17, '[]'::jsonb, null, 2),
  ('peter', '2026-09-18', '04:09', '12:52', '13:14', 490, 30, 0, 0, 21, 0, 4, 4, 4, 'work', 3, '17:30', 0, null, 131, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-19', '04:49', '13:43', '13:58', 495, 26, 0, 0, 15, 0, 1, 3, 3, 'free', 2, '17:30', 0, null, 168, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-20', '04:48', '14:02', '14:22', 514, 22, 1, 18, 20, 0, 3, 5, 5, 'free', 2, '17:30', 0, null, 44, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-21', '01:28', '10:02', '10:17', 452, 43, 1, 19, 14, 55, 2, 4, 4, 'work', 2, '17:30', 0, null, 108, 43, '[]'::jsonb, null, 2),
  ('peter', '2026-09-22', '03:37', '12:19', '12:48', 475, 35, 0, 0, 29, 66, 3, 5, 5, 'work', 2, '17:30', 0, null, 201, 28, '[]'::jsonb, null, 2),
  ('peter', '2026-09-23', '03:59', '11:38', '11:36', 415, 36, 0, 0, 0, 74, 3, 4, 4, 'work', 3, '17:30', 0, null, 203, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-24', '01:36', '10:35', '10:56', 495, 39, 1, 4, 21, 63, 3, 3, 3, 'work', 1, '17:30', 0, null, 187, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-25', '03:12', '10:39', '11:02', 394, 33, 0, 0, 23, 43, 3, 5, 5, 'work', 2, '17:30', 0, null, 27, 53, '[]'::jsonb, null, 2),
  ('peter', '2026-09-26', '04:49', '11:43', '12:02', 396, 14, 0, 0, 20, 0, 3, 3, 3, 'free', 0, '17:30', 0, null, 34, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-27', '04:38', '12:59', '13:00', 463, 27, 1, 11, 1, 55, 2, 5, 5, 'free', 1, '17:30', 0, null, 137, 51, '[]'::jsonb, null, 2),
  ('peter', '2026-09-28', '03:59', '11:04', '11:29', 377, 30, 0, 0, 25, 77, 3, 3, 5, 'work', 2, '17:30', 0, null, 128, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-29', '02:40', '10:43', '10:51', 457, 14, 0, 0, 8, 0, 3, 5, 5, 'work', 2, '17:30', 0, null, 47, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-09-30', '23:57', '07:37', '07:57', 449, 2, 0, 0, 20, 0, 2, 3, 3, 'work', 1, '17:30', 0, null, 57, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-01', '02:02', '09:27', '09:27', 419, 24, 0, 0, 0, 53, 4, 4, 4, 'work', 3, '17:30', 0, null, 174, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-02', '03:11', '10:00', '10:01', 374, 28, 2, 7, 1, 0, 3, 3, 3, 'work', 3, '17:30', 0, null, 29, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-03', '05:34', '13:33', '13:42', 437, 38, 1, 4, 9, 89, 2, 4, 4, 'free', 2, '17:30', 0, null, 112, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-04', '04:20', '13:28', '13:58', 515, 30, 0, 0, 29, 0, 3, 4, 3, 'free', 3, '17:30', 0, null, 58, 74, '[]'::jsonb, null, 2),
  ('peter', '2026-10-05', '03:09', '12:16', '12:22', 491, 52, 1, 3, 6, 69, 2, 4, 3, 'work', 0, '17:30', 0, null, 98, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-06', '02:41', '09:38', '09:46', 365, 35, 0, 0, 8, 34, 3, 3, 3, 'work', 0, '17:30', 0, null, 52, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-07', '01:58', '09:44', '10:00', 446, 24, 0, 0, 16, 86, 5, 5, 4, 'work', 4, '17:30', 0, null, 198, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-08', '01:43', '08:22', '08:36', 367, 21, 1, 12, 14, 0, 3, 3, 3, 'work', 3, '17:30', 0, null, 9, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-09', '02:21', '09:26', '09:37', 388, 27, 1, 10, 11, 0, 3, 5, 5, 'work', 1, '17:30', 0, null, 172, 38, '[]'::jsonb, null, 2),
  ('peter', '2026-10-10', '06:37', '15:35', '15:43', 518, 9, 0, 0, 8, 0, 2, 3, 3, 'free', 1, '17:30', 0, null, 203, 36, '[]'::jsonb, null, 2),
  ('peter', '2026-10-11', '04:17', '12:36', '12:57', 474, 29, 0, 0, 21, 0, 2, 4, 4, 'free', 2, '17:30', 0, null, 54, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-12', '02:12', '11:25', '11:48', 528, 23, 1, 1, 23, 0, 3, 5, 5, 'work', 1, '17:30', 0, null, 54, 67, '[]'::jsonb, null, 2),
  ('peter', '2026-10-13', '03:26', '09:21', '09:25', 325, 17, 0, 0, 3, 59, 3, 4, 4, 'work', 2, '17:30', 0, null, 58, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-14', '02:20', '09:20', '09:46', 407, 15, 1, 0, 27, 0, 2, 4, 4, 'work', 0, '17:30', 0, null, 29, 0, '[]'::jsonb, null, 2),
  ('peter', '2026-10-15', '01:01', '07:21', '07:45', 317, 47, 0, 0, 24, 0, 2, 4, 4, 'work', 2, '17:30', 0, null, 69, 0, '[]'::jsonb, null, 2),
  ('winkle', '2026-08-21', '22:27', '06:49', '06:57', 458, 12, 3, 33, 8, 0, 3, 4, 4, 'work', 2, '14:00', 0, null, 28, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-08-22', '22:26', '05:58', '06:06', 419, 10, 0, 0, 8, 116, 3, 4, 4, 'free', 4, '14:00', 0, null, 45, 31, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-08-23', '23:08', '06:54', '07:07', 438, 2, 1, 26, 13, 88, 3, 3, 3, 'free', 2, '14:00', 0, null, 45, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-08-24', '23:04', '08:33', '08:35', 512, 11, 3, 46, 2, 0, 3, 4, 2, 'work', 4, '14:00', 0, null, 66, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-08-25', '22:47', '07:00', '07:03', 453, 9, 2, 31, 3, 63, 3, 3, 3, 'work', 3, '14:00', 0, null, 50, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-08-26', '22:58', '07:30', '07:37', 475, 12, 2, 25, 7, 0, 2, 5, 5, 'work', 2, '14:00', 0, null, 42, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-08-27', '22:58', '06:49', '07:05', 426, 8, 2, 38, 15, 82, 3, 3, 3, 'work', 4, '14:00', 0, null, 57, 11, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-08-28', '23:08', '07:29', '07:31', 458, 7, 0, 0, 2, 116, 3, 3, 5, 'work', 4, '14:00', 0, null, 37, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-08-29', '23:29', '06:16', '06:29', 416, 9, 2, 0, 13, 68, 3, 3, 4, 'free', 2, '14:00', 0, null, 33, 17, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-08-30', '23:46', '07:10', '07:11', 416, 8, 3, 20, 1, 93, 3, 3, 4, 'free', 3, '14:00', 0, null, 39, 54, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-08-31', '22:49', '07:22', '07:30', 478, 6, 2, 28, 8, 62, 3, 3, 5, 'work', 5, '14:00', 0, null, 35, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-01', '22:23', '05:49', '06:03', 404, 7, 2, 35, 14, 103, 3, 3, 2, 'work', 4, '14:00', 0, null, 10, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-02', '23:27', '07:14', '07:30', 465, 4, 2, 0, 16, 95, 1, 5, 3, 'work', 1, '14:00', 0, null, 31, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-03', '23:20', '06:23', '06:35', 384, 2, 2, 40, 12, 68, 2, 5, 2, 'work', 4, '14:00', 0, null, 19, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-04', '22:20', '06:54', '07:06', 463, 2, 4, 51, 13, 77, 3, 4, 4, 'work', 1, '14:00', 0, null, 71, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-05', '23:37', '07:45', '08:01', 435, 11, 3, 42, 16, 0, 3, 5, 3, 'free', 2, '14:00', 0, null, 41, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-06', '00:10', '07:50', '07:51', 403, 12, 0, 0, 1, 143, 3, 3, 5, 'free', 3, '14:00', 0, null, 43, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-07', '22:23', '07:45', '07:45', 525, 8, 1, 28, 0, 77, 3, 5, 3, 'work', 3, '14:00', 0, null, 44, 32, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-08', '23:00', '07:49', '07:49', 478, 3, 1, 48, 0, 97, 2, 3, 3, 'work', 2, '14:00', 0, null, 24, 18, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-09', '23:10', '07:38', '07:44', 492, 2, 0, 0, 6, 95, 3, 3, 5, 'work', 3, '14:00', 0, null, 28, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-10', '22:40', '07:17', '07:29', 473, 7, 1, 36, 12, 0, 4, 3, 4, 'work', 2, '14:00', 0, null, 73, 41, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-11', '23:07', '06:10', '06:08', 402, 4, 3, 17, 0, 95, 3, 4, 4, 'work', 2, '14:00', 0, null, 28, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-12', '23:27', '06:12', '06:22', 414, 2, 0, 0, 10, 72, 2, 3, 3, 'free', 2, '14:00', 0, null, 57, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-13', '23:16', '06:03', '06:07', 373, 12, 2, 21, 4, 49, 2, 4, 1, 'free', 3, '14:00', 0, null, 2, 18, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-14', '22:41', '06:47', '06:55', 454, 4, 2, 28, 8, 100, 2, 3, 2, 'work', 4, '14:00', 0, null, 29, 0, '[]'::jsonb, null, 2),
  ('winkle', '2026-09-15', '22:24', '06:45', '06:57', 474, 14, 1, 12, 13, 49, 3, 4, 1, 'work', 3, '14:00', 0, null, 40, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-16', '22:46', '06:30', '06:38', 441, 6, 1, 17, 8, 0, 3, 4, 1, 'work', 0, '14:00', 0, null, 13, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-17', '22:59', '06:58', '07:06', 442, 5, 1, 33, 7, 65, 1, 3, 2, 'work', 2, '14:00', 0, null, 47, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-18', '23:19', '06:46', '06:58', 445, 2, 2, 2, 11, 45, 3, 5, 4, 'work', 5, '14:00', 0, null, 41, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-19', '23:20', '06:48', '06:59', 432, 7, 2, 8, 12, 24, 3, 3, 4, 'free', 0, '14:00', 0, null, 37, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-20', '22:57', '07:01', '07:09', 455, 12, 2, 18, 7, 52, 2, 5, 5, 'free', 2, '14:00', 0, null, 33, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-21', '23:20', '06:18', '06:41', 380, 8, 2, 30, 23, 62, 3, 3, 2, 'work', 3, '14:00', 0, null, 25, 38, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-22', '22:46', '08:05', '08:18', 508, 4, 3, 47, 13, 78, 3, 4, 4, 'work', 2, '14:00', 0, null, 54, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-23', '23:17', '06:16', '06:20', 403, 2, 3, 14, 3, 69, 3, 3, 3, 'work', 3, '14:00', 0, null, 39, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-24', '22:46', '05:56', '06:10', 391, 5, 0, 0, 14, 120, 4, 4, 5, 'work', 2, '14:00', 0, null, 54, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-25', '23:04', '07:56', '08:08', 485, 13, 0, 0, 11, 69, 4, 4, 4, 'work', 2, '14:00', 0, null, 26, 15, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-26', '23:02', '07:17', '07:20', 469, 2, 3, 26, 3, 95, 3, 4, 5, 'free', 2, '14:00', 0, null, 45, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-27', '23:56', '07:32', '07:36', 422, 8, 2, 27, 4, 81, 3, 3, 3, 'free', 4, '14:00', 0, null, 5, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-28', '23:07', '06:48', '07:01', 434, 7, 3, 20, 13, 80, 4, 5, 3, 'work', 0, '14:00', 0, null, 11, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-09-29', '22:47', '07:11', '07:23', 468, 3, 3, 33, 12, 107, 3, 5, 2, 'work', 3, '14:00', 0, null, 65, 0, '[]'::jsonb, null, 2),
  ('winkle', '2026-09-30', '23:18', '06:14', '06:32', 413, 4, 0, 0, 18, 25, 2, 5, 1, 'work', 4, '14:00', 0, null, 23, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-01', '23:24', '07:19', '07:27', 449, 8, 0, 0, 8, 0, 2, 5, 3, 'work', 4, '14:00', 0, null, 61, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-02', '23:09', '07:08', '07:22', 464, 2, 1, 20, 13, 0, 2, 5, 4, 'work', 5, '14:00', 0, null, 17, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-03', '00:22', '07:40', '07:50', 418, 10, 2, 10, 10, 126, 2, 5, 3, 'free', 3, '14:00', 0, null, 38, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-04', '23:00', '07:44', '07:57', 484, 12, 0, 0, 13, 90, 4, 4, 5, 'free', 2, '14:00', 0, null, 34, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-05', '22:47', '06:35', '06:43', 404, 6, 3, 58, 8, 57, 2, 4, 1, 'work', 4, '14:00', 0, null, 34, 23, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-06', '22:54', '05:26', '05:26', 364, 6, 4, 22, 0, 0, 3, 3, 3, 'work', 5, '14:00', 0, null, 83, 27, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-07', '23:02', '06:18', '06:31', 394, 2, 2, 40, 14, 0, 3, 3, 5, 'work', 3, '14:00', 0, null, 59, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-08', '22:58', '07:44', '07:58', 509, 2, 2, 18, 14, 0, 3, 3, 4, 'work', 1, '14:00', 0, null, 21, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-09', '22:58', '07:14', '07:21', 450, 4, 3, 41, 7, 81, 2, 3, 1, 'work', 1, '14:00', 0, null, 16, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-10', '23:23', '07:20', '07:28', 434, 7, 3, 36, 8, 81, 3, 4, 2, 'free', 3, '14:00', 0, null, 63, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-11', '22:47', '06:23', '06:38', 441, 6, 2, 8, 15, 0, 4, 4, 4, 'free', 4, '14:00', 0, null, 11, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-12', '23:10', '07:43', '07:56', 510, 2, 3, 4, 13, 97, 3, 3, 2, 'work', 2, '14:00', 0, null, 38, 38, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-13', '22:51', '06:40', '06:43', 430, 6, 4, 34, 2, 77, 3, 5, 1, 'work', 3, '14:00', 0, null, 58, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('winkle', '2026-10-14', '23:07', '06:13', '06:19', 397, 7, 3, 22, 7, 83, 3, 5, 5, 'work', 2, '14:00', 0, null, 10, 0, '[]'::jsonb, null, 2),
  ('winkle', '2026-10-15', '23:00', '07:36', '07:45', 491, 7, 3, 18, 9, 64, 3, 3, 1, 'work', 4, '14:00', 0, null, 65, 0, '[{"name": "Modafinilo", "dose": "200 mg"}]'::jsonb, null, 2),
  ('elena', '2026-08-21', '23:12', '07:55', '08:00', 507, 11, 0, 0, 5, 0, 4, 4, 4, 'work', 1, '08:30', 1, '21:00', 0, 27, '[]'::jsonb, null, 2),
  ('elena', '2026-08-22', '23:14', '08:19', '08:29', 553, 2, 0, 0, 10, 0, 5, 5, 4, 'free', 0, '08:30', 0, '21:00', 38, 48, '[]'::jsonb, null, 2),
  ('elena', '2026-08-23', '23:55', '08:16', '08:29', 493, 5, 0, 0, 13, 31, 3, 4, 4, 'free', 1, '08:30', 0, '21:00', 17, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-08-24', '22:44', '06:52', '07:01', 484, 2, 0, 0, 8, 0, 5, 4, 4, 'work', 1, '08:30', 0, '21:00', 18, 54, '[]'::jsonb, null, 2),
  ('elena', '2026-08-25', '22:57', '07:22', '07:28', 497, 2, 1, 7, 6, 0, 5, 5, 5, 'work', 1, '08:30', 0, '21:00', 27, 30, '[]'::jsonb, null, 2),
  ('elena', '2026-08-26', '23:04', '07:12', '07:16', 479, 6, 0, 0, 4, 0, 5, 5, 4, 'work', 2, '08:30', 0, '21:00', 45, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-08-27', '23:05', '05:48', '06:04', 384, 15, 0, 0, 16, 0, 4, 4, 4, 'work', 2, '08:30', 2, '21:00', 2, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-08-28', '22:47', '06:47', '06:52', 475, 7, 0, 0, 6, 0, 5, 5, 4, 'work', 1, '08:30', 0, '21:00', 7, 53, '[]'::jsonb, null, 2),
  ('elena', '2026-08-29', '23:24', '07:30', '07:35', 468, 16, 0, 0, 5, 0, 5, 5, 4, 'free', 2, '08:30', 0, '21:00', 8, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-08-30', '23:46', '08:53', '09:00', 538, 2, 0, 0, 7, 0, 4, 4, 4, 'free', 0, '08:30', 0, '21:00', 21, 58, '[]'::jsonb, null, 2),
  ('elena', '2026-08-31', '23:17', '06:18', '06:34', 410, 11, 1, 0, 16, 0, 3, 4, 4, 'work', 1, '08:30', 0, '21:00', 8, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-01', '23:23', '07:37', '07:45', 487, 8, 0, 0, 7, 0, 5, 5, 5, 'work', 1, '08:30', 0, '21:00', 9, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-02', '23:01', '06:28', '06:37', 429, 11, 0, 0, 9, 0, 5, 5, 4, 'work', 1, '08:30', 0, '21:00', 39, 67, '[]'::jsonb, null, 2),
  ('elena', '2026-09-03', '23:12', '07:05', '07:21', 475, 2, 0, 0, 15, 0, 4, 4, 4, 'work', 0, '08:30', 0, '21:00', 50, 70, '[]'::jsonb, null, 2),
  ('elena', '2026-09-04', '22:49', '06:20', '06:28', 421, 25, 0, 0, 8, 0, 4, 4, 4, 'work', 2, '08:30', 0, '21:00', 6, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-05', '23:08', '07:54', '07:57', 512, 6, 0, 0, 3, 0, 4, 4, 4, 'free', 1, '08:30', 1, '21:00', 12, 32, '[]'::jsonb, null, 2),
  ('elena', '2026-09-06', '23:40', '07:47', '08:00', 466, 18, 0, 0, 14, 0, 4, 4, 4, 'free', 0, '08:30', 2, '21:00', 6, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-07', '23:22', '07:08', '07:11', 450, 5, 1, 11, 4, 0, 4, 4, 4, 'work', 0, '08:30', 0, '21:00', 22, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-08', '23:15', '06:02', '06:08', 395, 11, 0, 0, 6, 0, 4, 4, 4, 'work', 2, '08:30', 0, '21:00', 17, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-09', '23:02', '06:21', '06:27', 423, 12, 1, 4, 6, 0, 4, 4, 4, 'work', 2, '08:30', 1, '21:00', 4, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-10', '22:35', '06:24', '06:30', 457, 6, 0, 0, 6, 0, 4, 4, 4, 'work', 2, '08:30', 3, '21:00', 24, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-11', '23:34', '07:12', '07:33', 448, 2, 0, 0, 22, 0, 4, 4, 4, 'work', 0, '08:30', 0, '21:00', 22, 58, '[]'::jsonb, null, 2),
  ('elena', '2026-09-12', '23:34', '07:26', '07:43', 457, 11, 0, 0, 17, 0, 5, 5, 4, 'free', 1, '08:30', 0, '21:00', 23, 32, '[]'::jsonb, null, 2),
  ('elena', '2026-09-13', '23:54', '08:44', '08:52', 523, 16, 0, 0, 9, 0, 5, 4, 4, 'free', 2, '08:30', 0, '21:00', 24, 45, '[]'::jsonb, null, 2),
  ('elena', '2026-09-14', '22:39', '07:01', '07:16', 480, 9, 0, 0, 15, 0, 4, 4, 4, 'work', 2, '08:30', 0, '21:00', 0, 38, '[]'::jsonb, null, 2),
  ('elena', '2026-09-15', '23:28', '06:28', '06:34', 406, 13, 1, 1, 6, 0, 4, 4, 4, 'work', 1, '08:30', 0, '21:00', 20, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-16', '22:16', '06:24', '06:36', 479, 4, 1, 5, 13, 0, 5, 4, 4, 'work', 2, '08:30', 1, '21:00', 15, 52, '[]'::jsonb, null, 2),
  ('elena', '2026-09-17', '22:58', '07:00', '07:05', 456, 21, 1, 6, 5, 0, 5, 5, 4, 'work', 2, '08:30', 0, '21:00', 22, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-18', '22:53', '06:53', '07:05', 466, 9, 1, 5, 12, 0, 4, 4, 4, 'work', 1, '08:30', 0, '21:00', 11, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-19', '23:10', '07:20', '07:36', 487, 2, 0, 0, 16, 0, 3, 4, 4, 'free', 2, '08:30', 0, '21:00', 38, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-20', '23:37', '07:14', '07:23', 447, 13, 1, 0, 9, 0, 5, 5, 5, 'free', 2, '08:30', 0, '21:00', 12, 56, '[]'::jsonb, null, 2),
  ('elena', '2026-09-21', '23:10', '06:28', '06:35', 432, 7, 0, 0, 7, 0, 4, 4, 4, 'work', 2, '08:30', 0, '21:00', 9, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-22', '22:55', '05:57', '06:02', 411, 8, 0, 0, 5, 10, 4, 4, 4, 'work', 2, '08:30', 2, '21:00', 4, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-23', '23:08', '07:39', '07:52', 496, 14, 0, 0, 13, 0, 5, 4, 4, 'work', 1, '08:30', 0, '21:00', 3, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-24', '23:06', '07:05', '07:10', 464, 13, 0, 0, 5, 7, 4, 4, 4, 'work', 2, '08:30', 0, '21:00', 23, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-25', '22:52', '07:13', '07:23', 493, 4, 0, 0, 9, 9, 4, 4, 4, 'work', 2, '08:30', 0, '21:00', 29, 47, '[]'::jsonb, null, 2),
  ('elena', '2026-09-26', '23:27', '07:45', '07:52', 488, 9, 0, 0, 7, 0, 4, 4, 4, 'free', 2, '08:30', 0, '21:00', 29, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-27', '23:12', '07:26', '07:33', 478, 14, 0, 0, 7, 0, 4, 4, 4, 'free', 1, '08:30', 1, '21:00', 8, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-28', '22:56', '06:35', '06:50', 454, 9, 0, 0, 14, 0, 4, 4, 4, 'work', 2, '08:30', 0, '21:00', 18, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-09-29', '23:30', '06:51', '06:58', 433, 2, 1, 8, 6, 7, 5, 5, 5, 'work', 2, '08:30', 1, '21:00', 18, 56, '[]'::jsonb, null, 2),
  ('elena', '2026-09-30', '23:01', '06:25', '06:33', 442, 2, 0, 0, 8, 0, 4, 4, 4, 'work', 2, '08:30', 0, '21:00', 29, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-10-01', '22:50', '07:38', '07:46', 518, 2, 0, 0, 8, 0, 4, 4, 4, 'work', 1, '08:30', 1, '21:00', 27, 37, '[]'::jsonb, null, 2),
  ('elena', '2026-10-02', '22:59', '07:19', '07:25', 486, 5, 1, 8, 5, 0, 4, 4, 4, 'work', 2, '08:30', 1, '21:00', 4, 32, '[]'::jsonb, null, 2),
  ('elena', '2026-10-03', '23:58', '07:24', '07:34', 434, 11, 0, 0, 10, 0, 5, 5, 4, 'free', 1, '08:30', 0, '21:00', 13, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-10-04', '23:43', '08:27', '08:29', 497, 14, 1, 13, 3, 0, 3, 3, 5, 'free', 0, '08:30', 0, '21:00', 17, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-10-05', '22:42', '06:30', '06:44', 447, 11, 0, 0, 14, 0, 4, 4, 4, 'work', 0, '08:30', 2, '21:00', 34, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-10-06', '23:11', '06:50', '07:06', 449, 4, 1, 7, 16, 0, 3, 4, 3, 'work', 2, '08:30', 0, '21:00', 44, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-10-07', '22:57', '06:36', '06:50', 455, 7, 0, 0, 14, 0, 4, 4, 4, 'work', 2, '08:30', 0, '21:00', 8, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-10-08', '23:01', '06:48', '06:54', 448, 12, 0, 0, 6, 18, 4, 4, 4, 'work', 1, '08:30', 0, '21:00', 55, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-10-09', '23:16', '06:58', '07:03', 448, 15, 0, 0, 5, 0, 4, 4, 4, 'work', 3, '08:30', 0, '21:00', 10, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-10-10', '23:12', '08:22', '08:28', 539, 6, 0, 0, 7, 0, 4, 4, 4, 'free', 3, '08:30', 1, '21:00', 2, 39, '[]'::jsonb, null, 2),
  ('elena', '2026-10-11', '23:26', '07:35', '07:39', 485, 5, 0, 0, 4, 0, 4, 4, 4, 'free', 2, '08:30', 0, '21:00', 1, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-10-12', '22:53', '07:12', '07:18', 491, 10, 1, 0, 6, 0, 5, 4, 4, 'work', 2, '08:30', 0, '21:00', 43, 33, '[]'::jsonb, null, 2),
  ('elena', '2026-10-13', '23:13', '07:29', '07:39', 481, 13, 0, 0, 11, 0, 4, 4, 4, 'work', 2, '08:30', 0, '21:00', 18, 27, '[]'::jsonb, null, 2),
  ('elena', '2026-10-14', '22:46', '06:11', '06:23', 425, 13, 0, 0, 12, 0, 4, 4, 4, 'work', 0, '08:30', 0, '21:00', 38, 0, '[]'::jsonb, null, 2),
  ('elena', '2026-10-15', '22:54', '06:40', '06:54', 455, 5, 0, 0, 14, 0, 3, 4, 4, 'work', 2, '08:30', 0, '21:00', 27, 0, '[]'::jsonb, null, 2),
  ('tomas', '2026-08-21', '21:25', '05:46', '05:43', 477, 24, 2, 0, 0, 142, 4, 4, 4, 'work', 0, null, 0, null, 47, 0, '[]'::jsonb, 'Siestas: [{"start":"15:49","end":"18:11"}]', 2),
  ('tomas', '2026-08-22', '22:20', '08:28', '08:52', 588, 20, 1, 0, 23, 98, 3, 3, 3, 'free', 0, null, 0, null, 29, 0, '[]'::jsonb, 'Siestas: [{"start":"14:52","end":"16:30"}]', 2),
  ('tomas', '2026-08-23', '22:04', '06:44', '06:53', 512, 9, 0, 0, 9, 87, 4, 4, 4, 'free', 0, null, 0, null, 93, 0, '[]'::jsonb, 'Siestas: [{"start":"15:27","end":"16:54"}]', 2),
  ('tomas', '2026-08-24', '21:26', '06:20', '06:26', 506, 28, 0, 0, 7, 68, 4, 4, 4, 'work', 0, null, 0, null, 12, 0, '[]'::jsonb, 'Siestas: [{"start":"16:06","end":"17:14"}]', 2),
  ('tomas', '2026-08-25', '21:51', '08:01', '08:15', 589, 20, 0, 0, 14, 110, 4, 4, 4, 'work', 0, null, 0, null, 43, 0, '[]'::jsonb, 'Siestas: [{"start":"16:04","end":"17:54"}]', 2),
  ('tomas', '2026-08-26', '20:25', '05:14', '05:19', 521, 8, 1, 0, 5, 118, 3, 5, 5, 'work', 0, null, 0, null, 35, 0, '[]'::jsonb, 'Siestas: [{"start":"15:32","end":"17:30"}]', 2),
  ('tomas', '2026-08-27', '21:20', '05:52', '06:05', 490, 23, 2, 0, 12, 68, 4, 4, 4, 'work', 0, null, 0, null, 41, 0, '[]'::jsonb, 'Siestas: [{"start":"16:14","end":"17:22"}]', 2),
  ('tomas', '2026-08-28', '21:32', '08:18', '08:29', 591, 28, 0, 0, 12, 128, 3, 4, 4, 'work', 0, null, 0, null, 77, 0, '[]'::jsonb, 'Siestas: [{"start":"15:59","end":"18:07"}]', 2),
  ('tomas', '2026-08-29', '22:20', '08:26', '08:42', 588, 19, 2, 0, 15, 96, 2, 5, 4, 'free', 0, null, 0, null, 69, 0, '[]'::jsonb, 'Siestas: [{"start":"16:45","end":"18:21"}]', 2),
  ('tomas', '2026-08-30', '22:01', '07:22', '07:35', 558, 3, 0, 0, 13, 86, 3, 5, 5, 'free', 0, null, 0, null, 64, 0, '[]'::jsonb, 'Siestas: [{"start":"15:47","end":"17:13"}]', 2),
  ('tomas', '2026-08-31', '21:03', '06:50', '07:00', 568, 18, 0, 0, 10, 151, 2, 4, 3, 'work', 0, null, 0, null, 37, 0, '[]'::jsonb, 'Siestas: [{"start":"16:15","end":"18:46"}]', 2),
  ('tomas', '2026-09-01', '21:34', '07:59', '08:11', 591, 12, 1, 21, 13, 37, 4, 4, 4, 'work', 0, null, 0, null, 43, 0, '[]'::jsonb, 'Siestas: [{"start":"16:16","end":"16:53"}]', 2),
  ('tomas', '2026-09-02', '21:01', '07:16', '07:24', 590, 25, 0, 0, 9, 74, 4, 4, 4, 'work', 0, null, 0, null, 35, 0, '[]'::jsonb, 'Siestas: [{"start":"16:16","end":"17:30"}]', 2),
  ('tomas', '2026-09-03', '20:52', '04:55', '05:10', 456, 27, 0, 0, 15, 84, 4, 4, 4, 'work', 0, null, 0, null, 53, 0, '[]'::jsonb, 'Siestas: [{"start":"16:44","end":"18:08"}]', 2),
  ('tomas', '2026-09-04', '20:54', '06:19', '06:29', 556, 10, 0, 0, 10, 135, 4, 4, 4, 'work', 0, null, 0, null, 60, 0, '[]'::jsonb, 'Siestas: [{"start":"15:56","end":"18:11"}]', 2),
  ('tomas', '2026-09-05', '22:20', '08:19', '08:30', 558, 23, 1, 19, 11, 72, 3, 3, 3, 'free', 0, null, 0, null, 36, 0, '[]'::jsonb, 'Siestas: [{"start":"15:34","end":"16:46"}]', 2),
  ('tomas', '2026-09-06', '22:55', '09:23', '09:30', 596, 11, 1, 21, 7, 0, 1, 3, 3, 'free', 0, null, 0, null, 34, 0, '[]'::jsonb, null, 2),
  ('tomas', '2026-09-07', '21:58', '07:01', '07:10', 518, 17, 1, 8, 9, 108, 2, 5, 4, 'work', 0, null, 0, null, 122, 0, '[]'::jsonb, 'Siestas: [{"start":"15:39","end":"17:27"}]', 2),
  ('tomas', '2026-09-08', '21:06', '07:06', '07:15', 557, 31, 0, 0, 9, 139, 4, 4, 4, 'work', 0, null, 0, null, 47, 0, '[]'::jsonb, 'Siestas: [{"start":"15:24","end":"17:43"}]', 2),
  ('tomas', '2026-09-09', '21:53', '08:08', '08:12', 574, 23, 1, 19, 5, 53, 3, 3, 3, 'work', 0, null, 0, null, 91, 0, '[]'::jsonb, 'Siestas: [{"start":"16:04","end":"16:57"}]', 2),
  ('tomas', '2026-09-10', '21:35', '06:17', '06:31', 507, 17, 0, 0, 14, 0, 3, 4, 3, 'work', 0, null, 0, null, 70, 0, '[]'::jsonb, null, 2),
  ('tomas', '2026-09-11', '22:01', '07:53', '07:58', 553, 19, 1, 19, 5, 96, 4, 4, 4, 'work', 0, null, 0, null, 57, 0, '[]'::jsonb, 'Siestas: [{"start":"14:28","end":"16:04"}]', 2),
  ('tomas', '2026-09-12', '22:51', '08:34', '08:46', 544, 19, 1, 20, 12, 0, 3, 3, 5, 'free', 0, null, 0, null, 57, 0, '[]'::jsonb, null, 2),
  ('tomas', '2026-09-13', '22:06', '08:31', '08:44', 616, 9, 1, 0, 13, 0, 4, 4, 4, 'free', 0, null, 0, null, 107, 0, '[]'::jsonb, null, 2),
  ('tomas', '2026-09-14', '21:13', '06:47', '06:51', 553, 11, 0, 0, 4, 0, 5, 5, 4, 'work', 0, null, 0, null, 14, 0, '[]'::jsonb, null, 2),
  ('tomas', '2026-09-15', '21:06', '06:14', '06:20', 523, 25, 0, 0, 6, 115, 5, 5, 4, 'work', 0, null, 0, null, 73, 0, '[]'::jsonb, 'Siestas: [{"start":"15:52","end":"17:47"}]', 2),
  ('tomas', '2026-09-16', '20:55', '06:19', '06:39', 533, 31, 1, 0, 20, 0, 3, 3, 5, 'work', 0, null, 0, null, 51, 0, '[]'::jsonb, null, 2),
  ('tomas', '2026-09-17', '21:06', '06:09', '06:19', 538, 5, 1, 0, 10, 134, 3, 3, 3, 'work', 0, null, 0, null, 73, 0, '[]'::jsonb, 'Siestas: [{"start":"16:43","end":"18:57"}]', 2),
  ('tomas', '2026-09-18', '21:01', '07:02', '07:17', 555, 21, 1, 26, 14, 62, 4, 4, 4, 'work', 0, null, 0, null, 43, 0, '[]'::jsonb, 'Siestas: [{"start":"15:17","end":"16:19"}]', 2),
  ('tomas', '2026-09-19', '22:02', '06:57', '07:10', 519, 16, 0, 0, 13, 148, 3, 3, 5, 'free', 0, null, 0, null, 94, 0, '[]'::jsonb, 'Siestas: [{"start":"15:28","end":"17:56"}]', 2),
  ('tomas', '2026-09-20', '22:23', '07:47', '07:59', 562, 2, 1, 0, 12, 149, 4, 4, 4, 'free', 0, null, 0, null, 53, 0, '[]'::jsonb, 'Siestas: [{"start":"15:59","end":"18:28"}]', 2),
  ('tomas', '2026-09-21', '21:13', '07:42', '07:50', 617, 12, 1, 0, 8, 117, 4, 4, 4, 'work', 0, null, 0, null, 27, 0, '[]'::jsonb, 'Siestas: [{"start":"14:30","end":"16:27"}]', 2),
  ('tomas', '2026-09-22', '21:35', '06:12', '06:19', 486, 9, 0, 0, 7, 106, 3, 3, 3, 'work', 0, null, 0, null, 54, 0, '[]'::jsonb, 'Siestas: [{"start":"15:23","end":"17:09"}]', 2),
  ('tomas', '2026-09-23', '22:00', '06:50', '07:05', 491, 18, 0, 0, 14, 89, 5, 5, 5, 'work', 0, null, 0, null, 55, 0, '[]'::jsonb, 'Siestas: [{"start":"16:24","end":"17:53"}]', 2),
  ('tomas', '2026-09-24', '20:39', '04:47', '04:59', 471, 17, 1, 0, 12, 87, 3, 5, 5, 'work', 0, null, 0, null, 71, 0, '[]'::jsonb, 'Siestas: [{"start":"15:03","end":"16:30"}]', 2),
  ('tomas', '2026-09-25', '21:41', '07:51', '07:57', 591, 19, 0, 0, 6, 97, 4, 4, 4, 'work', 0, null, 0, null, 112, 0, '[]'::jsonb, 'Siestas: [{"start":"15:57","end":"17:34"}]', 2),
  ('tomas', '2026-09-26', '22:06', '06:59', '06:56', 506, 19, 1, 8, 0, 114, 3, 3, 3, 'free', 0, null, 0, null, 83, 0, '[]'::jsonb, 'Siestas: [{"start":"15:06","end":"17:00"}]', 2),
  ('tomas', '2026-09-27', '21:52', '07:12', '07:24', 529, 31, 0, 0, 12, 121, 3, 5, 5, 'free', 0, null, 0, null, 54, 0, '[]'::jsonb, 'Siestas: [{"start":"15:47","end":"17:48"}]', 2),
  ('tomas', '2026-09-28', '21:38', '06:29', '06:46', 504, 19, 1, 8, 17, 90, 3, 3, 3, 'work', 0, null, 0, null, 27, 0, '[]'::jsonb, 'Siestas: [{"start":"16:01","end":"17:31"}]', 2),
  ('tomas', '2026-09-29', '21:01', '07:10', '07:25', 588, 21, 2, 0, 15, 69, 4, 4, 4, 'work', 0, null, 0, null, 45, 0, '[]'::jsonb, 'Siestas: [{"start":"15:50","end":"16:59"}]', 2),
  ('tomas', '2026-09-30', '21:38', '06:32', '06:39', 506, 28, 0, 0, 6, 71, 2, 5, 5, 'work', 0, null, 0, null, 76, 0, '[]'::jsonb, 'Siestas: [{"start":"13:55","end":"15:06"}]', 2),
  ('tomas', '2026-10-01', '21:15', '06:38', '06:56', 535, 28, 0, 0, 18, 122, 4, 4, 4, 'work', 0, null, 0, null, 29, 0, '[]'::jsonb, 'Siestas: [{"start":"15:16","end":"17:18"}]', 2),
  ('tomas', '2026-10-02', '20:48', '07:00', '07:07', 579, 12, 1, 20, 8, 67, 3, 3, 3, 'work', 0, null, 0, null, 73, 0, '[]'::jsonb, 'Siestas: [{"start":"16:46","end":"17:53"}]', 2),
  ('tomas', '2026-10-03', '21:32', '07:30', '07:44', 575, 23, 0, 0, 15, 92, 3, 3, 3, 'free', 0, null, 0, null, 30, 0, '[]'::jsonb, 'Siestas: [{"start":"15:28","end":"17:00"}]', 2),
  ('tomas', '2026-10-04', '21:43', '06:56', '07:15', 523, 18, 0, 0, 19, 93, 2, 5, 5, 'free', 0, null, 0, null, 67, 0, '[]'::jsonb, 'Siestas: [{"start":"14:13","end":"15:46"}]', 2),
  ('tomas', '2026-10-05', '21:49', '07:18', '07:37', 534, 26, 1, 9, 19, 79, 3, 5, 5, 'work', 0, null, 0, null, 22, 0, '[]'::jsonb, 'Siestas: [{"start":"16:25","end":"17:44"}]', 2),
  ('tomas', '2026-10-06', '21:24', '06:59', '07:09', 519, 24, 0, 0, 10, 113, 3, 4, 3, 'work', 0, null, 0, null, 44, 0, '[]'::jsonb, 'Siestas: [{"start":"16:15","end":"18:08"}]', 2),
  ('tomas', '2026-10-07', '21:18', '07:15', '07:22', 532, 29, 1, 36, 7, 0, 3, 3, 3, 'work', 0, null, 0, null, 53, 0, '[]'::jsonb, null, 2),
  ('tomas', '2026-10-08', '21:13', '05:58', '06:18', 508, 17, 0, 0, 20, 95, 4, 4, 4, 'work', 0, null, 0, null, 102, 0, '[]'::jsonb, 'Siestas: [{"start":"15:13","end":"16:48"}]', 2),
  ('tomas', '2026-10-09', '21:16', '06:59', '07:05', 568, 16, 1, 0, 6, 92, 3, 5, 5, 'work', 0, null, 0, null, 53, 0, '[]'::jsonb, 'Siestas: [{"start":"14:15","end":"15:47"}]', 2),
  ('tomas', '2026-10-10', '21:54', '08:35', '08:44', 614, 19, 0, 0, 9, 123, 3, 4, 3, 'free', 0, null, 0, null, 66, 0, '[]'::jsonb, 'Siestas: [{"start":"15:09","end":"17:12"}]', 2),
  ('tomas', '2026-10-11', '21:52', '08:22', '08:30', 614, 16, 1, 0, 9, 0, 3, 3, 3, 'free', 0, null, 0, null, 64, 0, '[]'::jsonb, null, 2),
  ('tomas', '2026-10-12', '21:19', '08:07', '08:11', 619, 4, 1, 25, 4, 147, 3, 3, 3, 'work', 0, null, 0, null, 16, 0, '[]'::jsonb, 'Siestas: [{"start":"14:48","end":"17:15"}]', 2),
  ('tomas', '2026-10-13', '21:01', '06:54', '06:59', 554, 21, 0, 0, 6, 0, 4, 4, 4, 'work', 0, null, 0, null, 30, 0, '[]'::jsonb, null, 2),
  ('tomas', '2026-10-14', '20:51', '06:39', '06:53', 546, 18, 2, 24, 14, 115, 4, 4, 4, 'work', 0, null, 0, null, 55, 0, '[]'::jsonb, 'Siestas: [{"start":"16:20","end":"18:15"}]', 2),
  ('tomas', '2026-10-15', '21:15', '06:18', '06:29', 528, 15, 1, 0, 11, 60, 2, 4, 4, 'work', 0, null, 0, null, 44, 0, '[]'::jsonb, 'Siestas: [{"start":"14:31","end":"15:31"}]', 2)
)
insert into public.sleep_diary (patient_email, diary_date, bedtime, wake_time, get_up_time,
  sleep_minutes, sleep_latency_mins, awakenings, wake_in_bed_mins, awake_in_bed_after_mins,
  nap_minutes, sleep_quality, mood, energy, day_type, coffee_cups, last_caffeine_time,
  alcohol_drinks, last_alcohol_time, screen_minutes, exercise_mins, medications, notes,
  schema_version)
select g.email, d.diary_date::date, d.bedtime::time, d.wake_time::time, d.get_up_time::time,
       d.sleep_minutes, d.sleep_latency_mins, d.awakenings, d.wake_in_bed_mins,
       d.awake_in_bed_after_mins, d.nap_minutes, d.sleep_quality, d.mood, d.energy,
       d.day_type, d.coffee_cups, d.last_caffeine_time::time, d.alcohol_drinks,
       d.last_alcohol_time::time, d.screen_minutes, d.exercise_mins, d.medications,
       d.notes, d.schema_version
  from d join gente g on g.k = d.k;

commit;

-- ── 4 · Las escalas que encienden cada etiqueta ────────────────────
-- Los cortes son los que usa la app (DM_CORTES_TAG): ISI>=11 insomnio,
-- STOP-BANG>=5 sahos, IRLS>=15 spi, RBD-SQ>=8 parasomnia. Las fechas van
-- escalonadas para que no parezcan todas del mismo día.
begin;

with gente as (
  (select 'juana'::text as k, email from public.patients where code = 'JUANA1' limit 1)
  union all (select 'quijano'::text as k, email from public.patients where code = 'QUIJAN' limit 1)
  union all (select 'kahlo'::text as k, email from public.patients where code = 'KAHLO1' limit 1)
  union all (select 'frank'::text as k, email from public.patients where code = 'FRANK1' limit 1)
  union all (select 'peter'::text as k, email from public.patients where code = 'PETER1' limit 1)
  union all (select 'winkle'::text as k, email from public.patients where code = 'AURORA' limit 1)
  union all (select 'elena'::text as k, email from public.patients where code = 'ELENA1' limit 1)
  union all (select 'tomas'::text as k, email from public.patients where code = 'TOMAS1' limit 1)
)
delete from public.evaluations e using gente g where e.patient_email = g.email;

with gente as (
  (select 'juana'::text as k, email from public.patients where code = 'JUANA1' limit 1)
  union all (select 'quijano'::text as k, email from public.patients where code = 'QUIJAN' limit 1)
  union all (select 'kahlo'::text as k, email from public.patients where code = 'KAHLO1' limit 1)
  union all (select 'frank'::text as k, email from public.patients where code = 'FRANK1' limit 1)
  union all (select 'peter'::text as k, email from public.patients where code = 'PETER1' limit 1)
  union all (select 'winkle'::text as k, email from public.patients where code = 'AURORA' limit 1)
  union all (select 'elena'::text as k, email from public.patients where code = 'ELENA1' limit 1)
  union all (select 'tomas'::text as k, email from public.patients where code = 'TOMAS1' limit 1)
),
s (k, scale_id, score, max_score, interpretation, dias_atras) as (
  values
  ('juana', 'isi', 22, 28, 'Insomnio severo', 12),
  ('juana', 'psqi', 13, 21, 'Calidad de sueño patológica', 12),
  ('juana', 'gad7', 12, 21, 'Ansiedad moderada', 30),
  ('juana', 'phq9', 8, 27, 'Síntomas depresivos leves', 30),
  ('juana', 'ess', 7, 24, 'Sin somnolencia diurna excesiva', 45),
  ('juana', 'stopbang', 1, 8, 'Riesgo bajo de apnea', 45),
  ('juana', 'dbas', 68, 160, 'Creencias disfuncionales presentes', 20),
  ('quijano', 'stopbang', 6, 8, 'Riesgo alto de apnea', 8),
  ('quijano', 'ess', 14, 24, 'Somnolencia moderada-grave', 8),
  ('quijano', 'isi', 13, 28, 'Insomnio moderado', 22),
  ('quijano', 'psqi', 11, 21, 'Calidad de sueño patológica', 22),
  ('quijano', 'sassv', 24, 32, 'Alto riesgo, derivar', 35),
  ('quijano', 'fss', 38, 63, 'Fatiga moderada', 50),
  ('kahlo', 'irls', 24, 40, 'SPI severo', 10),
  ('kahlo', 'isi', 17, 28, 'Insomnio moderado', 10),
  ('kahlo', 'psqi', 14, 21, 'Calidad de sueño patológica', 25),
  ('kahlo', 'fss', 52, 63, 'Fatiga severa', 25),
  ('kahlo', 'phq9', 11, 27, 'Depresión moderada', 40),
  ('kahlo', 'ess', 6, 24, 'Sin somnolencia diurna excesiva', 55),
  ('frank', 'rbdq', 10, 13, 'Alto riesgo de trastorno de conducta REM', 14),
  ('frank', 'isi', 14, 28, 'Insomnio moderado', 14),
  ('frank', 'psqi', 12, 21, 'Calidad de sueño patológica', 28),
  ('frank', 'ess', 9, 24, 'Somnolencia leve', 28),
  ('frank', 'gad7', 9, 21, 'Ansiedad leve', 42),
  ('peter', 'meq', 27, 86, 'Vespertino definido', 9),
  ('peter', 'isi', 9, 28, 'Insomnio subclínico', 9),
  ('peter', 'ess', 11, 24, 'Somnolencia diurna excesiva', 26),
  ('peter', 'psqi', 8, 21, 'Calidad de sueño alterada', 38),
  ('winkle', 'ess', 19, 24, 'Somnolencia diurna grave', 11),
  ('winkle', 'isi', 6, 28, 'Sin insomnio clínico', 11),
  ('winkle', 'fss', 55, 63, 'Fatiga severa', 24),
  ('winkle', 'psqi', 7, 21, 'Calidad de sueño alterada', 33),
  ('winkle', 'stopbang', 1, 8, 'Riesgo bajo de apnea', 48),
  ('elena', 'isi', 3, 28, 'Sin insomnio clínico', 15),
  ('elena', 'psqi', 3, 21, 'Buena calidad de sueño', 15),
  ('elena', 'ess', 5, 24, 'Sin somnolencia diurna excesiva', 30),
  ('elena', 'stopbang', 0, 8, 'Riesgo bajo de apnea', 30),
  ('elena', 'gad7', 2, 21, 'Sin ansiedad', 44)
)
insert into public.evaluations (patient_email, scale_id, score, max_score,
                                interpretation, created_at)
select g.email, s.scale_id, s.score, s.max_score, s.interpretation,
       now() - (s.dias_atras || ' days')::interval
  from s join gente g on g.k = s.k;

commit;

-- ── 5 · Narcolepsia, a mano ────────────────────────────────────────
-- La app NO la auto-marca, y es correcto: no hay instrumento cargado que
-- la tamice, y marcarla desde un Epworth alto sería etiquetar de
-- narcolepsia a cualquiera que duerma poco. Va en `added`, que es el
-- campo de las etiquetas que pone el profesional. De paso el demo
-- muestra que se pueden marcar a mano.
update public.patients
   set tags = jsonb_build_object('added','["narcolepsia"]'::jsonb,
                                 'dismissed','[]'::jsonb,
                                 'resolved','["narcolepsia"]'::jsonb)
 where code = 'AURORA';

-- A los otros siete se les saca el sello de versión para que la app les
-- resuelva las etiquetas de nuevo con el diario y las escalas nuevas.
-- Sin esto, backgroundFillMissingTags da por buenas las que ya estaban.
update public.patients
   set tags = coalesce(tags,'{}'::jsonb) - 'v' - 'resolved'
 where code in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','ELENA1','TOMAS1');

-- ── 6 · Control ────────────────────────────────────────────────────
select p.code, p.name || ' ' || coalesce(p.lname,'') as paciente,
       p.parent_email is not null as es_hijo,
       count(distinct s.diary_date) as noches,
       count(distinct e.id) as escalas,
       coalesce(p.tags->>'added','—') as etiquetas_a_mano
  from public.patients p
  left join public.sleep_diary s on s.patient_email = p.email
   and s.diary_date between date '2026-08-21' and date '2026-10-15'
  left join public.evaluations e on e.patient_email = p.email
 where p.code in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1')
 group by p.code, p.name, p.lname, p.parent_email, p.tags
 order by p.code;

select count(*) as demos_que_sobran
  from public.patients
 where (email like '%@demo.dormetria.com' or email like '%.demo@dormetria.com'
          or is_demo = true)
     and coalesce(code,'') not in ('JUANA1','QUIJAN','KAHLO1','FRANK1','PETER1','AURORA','ELENA1','TOMAS1');
