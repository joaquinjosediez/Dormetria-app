-- ════════════════════════════════════════════════════════════════════
--  Dos perfiles pediátricos NORMALES, para mostrar en clase
--
--  · Bruno Buendía · 9 meses · dos siestas + despertares para alimentarse
--      Ya existe como demo, pero SIN siestas cargadas: por eso el pilar de
--      cantidad le daba 4 por ciento. Se le reescriben las 30 noches.
--  · Olivia Sanz   · 2 años  · una siesta de tarde, noche de corrido
--      Nueva.
--
--  Los dos quedan DENTRO del rango de la NSF 2015 contando el sueño de 24 h
--  (noche + siestas), que es como se mide en pediatría:
--      9 meses -> 12–15 h   ·   2 años -> 11–14 h
--
--  Correr entero en el editor SQL de Supabase. Es idempotente: borra las
--  noches de esos dos correos antes de insertar, así se puede repetir.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Las fichas ───────────────────────────────────────────────────
-- A Bruno solo se le confirma la fecha de nacimiento y la marca de demo; el
-- resto de su ficha queda como está.
update public.patients
   set dob = '2025-12-20', is_demo = true
 where email = 'bruno.buendia@demo.dormetria.com';

insert into public.patients (email, name, lname, dob, sex, is_demo, code)
values ('olivia.sanz@demo.dormetria.com', 'Olivia', 'Sanz', '2024-09-19', 'F', true, 'OLIVIA')
on conflict (email) do update
  set name = excluded.name, lname = excluded.lname, dob = excluded.dob,
      sex = excluded.sex, is_demo = true;

-- ── 2. Vincular a Olivia ────────────────────────────────────────────
-- Bruno ya está vinculado. Cambiá el correo si la querés en otra cuenta.
insert into public.doctor_patients (doctor_email, patient_email)
values ('drjoaquindiez@gmail.com', 'olivia.sanz@demo.dormetria.com')
on conflict do nothing;

-- ── 3. Treinta noches cada uno ──────────────────────────────────────

delete from public.sleep_diary where patient_email = 'bruno.buendia@demo.dormetria.com';
insert into public.sleep_diary (patient_email, diary_date, bedtime, wake_time, get_up_time, sleep_latency_mins, sleep_minutes, awakenings, awakening_detail, wake_in_bed_mins, awake_in_bed_after_mins, nap_start, nap_minutes, sleep_quality, mood, energy, day_type, screen_minutes, coffee_cups, alcohol_drinks, exercise_mins, notes, schema_version) values
  ('bruno.buendia@demo.dormetria.com', '2026-08-21', '20:17', '07:32', '07:43', 17, 635, 2, '[{"time": "00:22", "duration": "8"}, {"time": "03:27", "duration": "15"}]', 23, 11, '09:42', 133, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:42", "end": "10:39"}, {"start": "13:18", "end": "14:34"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-22', '20:30', '08:17', '08:29', 5, 691, 1, '[{"time": "00:33", "duration": "11"}]', 11, 12, '09:47', 167, 4, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:47", "end": "10:57"}, {"start": "13:37", "end": "15:14"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-23', '20:47', '07:55', '08:01', 10, 649, 1, '[{"time": "01:06", "duration": "9"}]', 9, 6, '10:10', 182, 4, 5, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "10:10", "end": "11:26"}, {"start": "13:37", "end": "15:23"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-24', '20:11', '07:18', '07:29', 7, 644, 1, '[{"time": "00:23", "duration": "16"}]', 16, 11, '09:30', 214, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:30", "end": "11:08"}, {"start": "13:13", "end": "15:09"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-25', '20:15', '07:27', '07:33', 14, 644, 1, '[{"time": "23:50", "duration": "14"}]', 14, 6, '09:15', 138, 5, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:15", "end": "09:51"}, {"start": "13:37", "end": "15:19"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-26', '20:23', '08:28', '08:32', 13, 685, 2, '[{"time": "00:01", "duration": "19"}, {"time": "03:16", "duration": "8"}]', 27, 4, '09:20', 176, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:20", "end": "10:35"}, {"start": "13:15", "end": "14:56"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-27', '20:24', '08:03', '08:07', 7, 663, 2, '[{"time": "00:37", "duration": "12"}, {"time": "03:41", "duration": "17"}]', 29, 4, '09:37', 165, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:37", "end": "10:43"}, {"start": "13:29", "end": "15:08"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-28', '20:09', '08:18', '08:30', 17, 642, 3, '[{"time": "00:27", "duration": "26"}, {"time": "03:23", "duration": "23"}, {"time": "06:00", "duration": "21"}]', 70, 12, '09:33', 165, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:33", "end": "10:48"}, {"start": "13:30", "end": "15:00"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-29', '20:47', '07:45', '07:54', 13, 621, 2, '[{"time": "00:43", "duration": "12"}, {"time": "03:58", "duration": "12"}]', 24, 9, '09:48', 167, 5, 4, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:48", "end": "11:04"}, {"start": "13:46", "end": "15:17"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-30', '20:34', '08:28', '08:40', 14, 680, 2, '[{"time": "00:55", "duration": "10"}, {"time": "03:52", "duration": "10"}]', 20, 12, '09:42', 167, 5, 5, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:42", "end": "10:48"}, {"start": "14:03", "end": "15:44"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-31', '20:26', '07:43', '07:47', 12, 641, 2, '[{"time": "00:14", "duration": "6"}, {"time": "03:30", "duration": "18"}]', 24, 4, '09:20', 157, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:20", "end": "10:43"}, {"start": "13:26", "end": "14:40"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-01', '20:09', '07:37', '07:44', 12, 645, 2, '[{"time": "00:28", "duration": "17"}, {"time": "03:10", "duration": "14"}]', 31, 7, '09:35', 167, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:35", "end": "10:54"}, {"start": "13:45", "end": "15:13"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-02', '20:13', '07:44', '07:47', 11, 630, 3, '[{"time": "00:21", "duration": "19"}, {"time": "02:46", "duration": "12"}, {"time": "06:15", "duration": "19"}]', 50, 3, '09:13', 161, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:13", "end": "10:23"}, {"start": "13:16", "end": "14:47"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-03', '20:05', '07:21', '07:29', 16, 644, 1, '[{"time": "00:28", "duration": "16"}]', 16, 8, '09:34', 150, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:34", "end": "10:41"}, {"start": "13:17", "end": "14:40"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-04', '20:21', '07:07', '07:10', 5, 630, 1, '[{"time": "00:25", "duration": "11"}]', 11, 3, '09:16', 196, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:16", "end": "10:48"}, {"start": "13:28", "end": "15:12"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-05', '20:51', '08:01', '08:08', 10, 642, 2, '[{"time": "00:55", "duration": "9"}, {"time": "03:27", "duration": "9"}]', 18, 7, '09:42', 160, 5, 5, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:42", "end": "10:46"}, {"start": "13:44", "end": "15:20"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-06', '20:28', '08:36', '08:42', 10, 664, 3, '[{"time": "00:10", "duration": "15"}, {"time": "03:32", "duration": "18"}, {"time": "06:41", "duration": "21"}]', 54, 6, '09:57', 158, 5, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:57", "end": "11:05"}, {"start": "14:02", "end": "15:32"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-07', '20:15', '07:02', '07:05', 9, 610, 2, '[{"time": "00:21", "duration": "16"}, {"time": "02:53", "duration": "12"}]', 28, 3, '09:16', 172, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:16", "end": "10:31"}, {"start": "13:29", "end": "15:06"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-08', '20:16', '07:59', '08:09', 10, 672, 2, '[{"time": "00:26", "duration": "8"}, {"time": "03:32", "duration": "13"}]', 21, 10, '09:32', 141, 5, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:32", "end": "10:13"}, {"start": "13:16", "end": "14:56"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-09', '20:25', '07:56', '08:06', 9, 654, 2, '[{"time": "00:30", "duration": "10"}, {"time": "03:31", "duration": "18"}]', 28, 10, '09:24', 171, 4, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:24", "end": "10:39"}, {"start": "13:13", "end": "14:49"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-10', '20:06', '07:44', '07:50', 8, 671, 2, '[{"time": "23:40", "duration": "10"}, {"time": "02:58", "duration": "9"}]', 19, 6, '09:42', 164, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:42", "end": "10:51"}, {"start": "13:28", "end": "15:03"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-11', '20:10', '06:34', '06:39', 12, 583, 2, '[{"time": "00:31", "duration": "10"}, {"time": "03:16", "duration": "19"}]', 29, 5, '09:37', 196, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:37", "end": "10:51"}, {"start": "13:26", "end": "15:28"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-12', '20:42', '07:36', '07:44', 16, 611, 2, '[{"time": "00:58", "duration": "14"}, {"time": "03:54", "duration": "13"}]', 27, 8, '10:06', 151, 4, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "10:06", "end": "11:08"}, {"start": "13:57", "end": "15:26"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-13', '20:40', '07:33', '07:41', 9, 637, 1, '[{"time": "00:28", "duration": "7"}]', 7, 8, '09:53', 178, 5, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:53", "end": "11:31"}, {"start": "13:59", "end": "15:19"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-14', '20:17', '08:18', '08:27', 9, 680, 2, '[{"time": "00:17", "duration": "17"}, {"time": "02:48", "duration": "15"}]', 32, 9, '09:14', 186, 5, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:14", "end": "10:34"}, {"start": "13:20", "end": "15:06"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-15', '20:26', '07:42', '07:48', 6, 642, 2, '[{"time": "00:23", "duration": "13"}, {"time": "03:30", "duration": "15"}]', 28, 6, '09:40', 156, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:40", "end": "10:43"}, {"start": "13:47", "end": "15:20"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-16', '20:24', '07:55', '08:04', 6, 641, 3, '[{"time": "00:03", "duration": "19"}, {"time": "03:10", "duration": "20"}, {"time": "06:24", "duration": "5"}]', 44, 9, '09:46', 166, 4, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:46", "end": "11:17"}, {"start": "13:19", "end": "14:34"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-17', '20:15', '07:50', '07:59', 11, 636, 3, '[{"time": "00:22", "duration": "15"}, {"time": "02:57", "duration": "15"}, {"time": "05:51", "duration": "18"}]', 48, 9, '09:29', 186, 5, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:29", "end": "10:44"}, {"start": "13:33", "end": "15:24"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-18', '20:13', '07:50', '07:53', 15, 666, 1, '[{"time": "00:04", "duration": "16"}]', 16, 3, '09:14', 188, 4, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:14", "end": "10:46"}, {"start": "13:24", "end": "15:00"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-19', '20:39', '08:14', '08:21', 12, 660, 2, '[{"time": "00:50", "duration": "9"}, {"time": "03:49", "duration": "14"}]', 23, 7, '09:49', 183, 5, 4, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:49", "end": "11:15"}, {"start": "14:10", "end": "15:47"}]', 2);

delete from public.sleep_diary where patient_email = 'olivia.sanz@demo.dormetria.com';
insert into public.sleep_diary (patient_email, diary_date, bedtime, wake_time, get_up_time, sleep_latency_mins, sleep_minutes, awakenings, awakening_detail, wake_in_bed_mins, awake_in_bed_after_mins, nap_start, nap_minutes, sleep_quality, mood, energy, day_type, screen_minutes, coffee_cups, alcohol_drinks, exercise_mins, notes, schema_version) values
  ('olivia.sanz@demo.dormetria.com', '2026-08-21', '20:39', '08:13', '08:24', 14, 672, 1, '[{"time": "00:58", "duration": "8"}]', 8, 11, '13:35', 97, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:35", "end": "15:12"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-22', '21:22', '08:52', '08:58', 21, 669, 0, null, 0, 6, '14:03', 89, 4, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:03", "end": "15:32"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-23', '21:26', '08:53', '09:02', 18, 669, 0, null, 0, 9, '14:31', 96, 5, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:31", "end": "16:07"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-24', '20:39', '08:22', '08:30', 12, 686, 1, '[{"time": "00:59", "duration": "5"}]', 5, 8, '13:34', 89, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:34", "end": "15:03"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-25', '20:48', '08:27', '08:39', 9, 690, 0, null, 0, 12, '13:59', 98, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:59", "end": "15:37"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-26', '20:39', '08:06', '08:13', 16, 671, 0, null, 0, 7, '13:33', 88, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:33", "end": "15:01"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-27', '20:43', '07:34', '07:43', 13, 638, 0, null, 0, 9, '13:40', 98, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:40", "end": "15:18"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-28', '20:53', '07:31', '07:40', 12, 626, 0, null, 0, 9, '13:56', 86, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:56", "end": "15:22"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-29', '21:19', '08:32', '08:41', 17, 656, 0, null, 0, 9, '14:33', 100, 5, 4, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:33", "end": "16:13"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-30', '21:21', '08:39', '08:46', 22, 656, 0, null, 0, 7, '14:04', 94, 5, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:04", "end": "15:38"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-31', '20:50', '08:01', '08:10', 8, 663, 0, null, 0, 9, '13:40', 71, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:40", "end": "14:51"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-01', '20:42', '07:56', '08:08', 14, 660, 0, null, 0, 12, '13:30', 98, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:30", "end": "15:08"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-02', '20:54', '07:57', '08:06', 24, 639, 0, null, 0, 9, '13:59', 87, 5, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:59", "end": "15:26"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-03', '20:36', '07:00', '07:04', 15, 609, 0, null, 0, 4, '13:33', 94, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:33", "end": "15:07"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-04', '20:53', '08:17', '08:24', 11, 673, 0, null, 0, 7, '13:48', 95, 5, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:48", "end": "15:23"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-05', '21:21', '08:30', '08:34', 16, 653, 0, null, 0, 4, '14:32', 75, 4, 5, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:32", "end": "15:47"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-06', '21:15', '09:00', '09:11', 11, 694, 0, null, 0, 11, '14:00', 89, 5, 5, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:00", "end": "15:29"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-07', '20:42', '07:46', '07:57', 9, 655, 0, null, 0, 11, '13:45', 83, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:45", "end": "15:08"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-08', '20:33', '07:26', '07:35', 15, 638, 0, null, 0, 9, '13:51', 84, 4, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:51", "end": "15:15"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-09', '20:45', '08:27', '08:31', 26, 676, 0, null, 0, 4, '13:41', 80, 4, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:41", "end": "15:01"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-10', '20:36', '08:20', '08:26', 16, 688, 0, null, 0, 6, '13:34', 122, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:34", "end": "15:36"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-11', '20:36', '08:13', '08:22', 15, 673, 1, '[{"time": "00:25", "duration": "9"}]', 9, 9, '13:56', 105, 5, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:56", "end": "15:41"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-12', '21:21', '09:07', '09:13', 13, 688, 1, '[{"time": "01:07", "duration": "5"}]', 5, 6, '14:27', 88, 4, 5, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:27", "end": "15:55"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-13', '21:22', '08:38', '08:44', 16, 655, 1, '[{"time": "01:46", "duration": "5"}]', 5, 6, '14:14', 73, 4, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:14", "end": "15:27"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-14', '20:49', '08:06', '08:09', 23, 654, 0, null, 0, 3, '13:27', 93, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:27", "end": "15:00"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-15', '20:40', '08:11', '08:16', 19, 663, 1, '[{"time": "00:41", "duration": "9"}]', 9, 5, '14:02', 98, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "14:02", "end": "15:40"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-16', '20:39', '07:48', '07:52', 26, 643, 0, null, 0, 4, '13:34', 114, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:34", "end": "15:28"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-17', '20:46', '07:42', '07:50', 14, 642, 0, null, 0, 8, '13:36', 71, 4, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:36", "end": "14:47"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-18', '20:57', '07:46', '07:50', 5, 644, 0, null, 0, 4, '13:56', 100, 4, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:56", "end": "15:36"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-19', '21:05', '08:24', '08:31', 10, 669, 0, null, 0, 7, '13:57', 103, 5, 4, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "13:57", "end": "15:40"}]', 2);

-- ── 4. Comprobación ─────────────────────────────────────────────────
-- Las dos filas tienen que caer dentro de su rango.
select p.name,
       round(avg(d.sleep_minutes)/60.0, 1)                        as noche_h,
       round(avg(coalesce(d.nap_minutes,0))/60.0, 1)              as siestas_h,
       round(avg(d.sleep_minutes + coalesce(d.nap_minutes,0))/60.0, 1) as total_24h,
       round(avg(d.awakenings), 1)                                as desp_noche,
       count(*)                                                   as noches
from   public.sleep_diary d
join   public.patients p on p.email = d.patient_email
where  d.patient_email in ('bruno.buendia@demo.dormetria.com',
                           'olivia.sanz@demo.dormetria.com')
group by p.name;

