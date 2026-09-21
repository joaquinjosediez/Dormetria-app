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
  ('bruno.buendia@demo.dormetria.com', '2026-08-21', '20:17', '07:17', '07:28', 17, 620, 2, '[{"time": "00:17", "duration": "8"}, {"time": "03:17", "duration": "15"}]', 23, 11, '09:08', 173, 5, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:08", "end": "10:26"}, {"start": "13:02", "end": "14:37"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-22', '20:40', '08:05', '08:11', 17, 640, 3, '[{"time": "00:53", "duration": "12"}, {"time": "03:18", "duration": "8"}, {"time": "06:09", "duration": "8"}]', 28, 6, '09:51', 140, 5, 4, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:51", "end": "11:03"}, {"start": "13:42", "end": "14:50"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-23', '20:37', '07:23', '07:27', 14, 611, 2, '[{"time": "00:06", "duration": "11"}, {"time": "03:19", "duration": "10"}]', 21, 4, '09:42', 165, 5, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:42", "end": "11:00"}, {"start": "13:36", "end": "15:03"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-24', '20:06', '07:27', '07:30', 11, 642, 2, '[{"time": "23:56", "duration": "14"}, {"time": "03:11", "duration": "14"}]', 28, 3, '09:22', 175, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:22", "end": "10:32"}, {"start": "13:23", "end": "15:08"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-25', '20:12', '07:46', '07:49', 14, 648, 2, '[{"time": "23:41", "duration": "20"}, {"time": "02:44", "duration": "12"}]', 32, 3, '09:28', 197, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:28", "end": "10:52"}, {"start": "13:08", "end": "14:34"}, {"start": "16:44", "end": "17:11"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-26', '20:23', '07:02', '07:14', 9, 593, 2, '[{"time": "23:47", "duration": "16"}, {"time": "03:00", "duration": "21"}]', 37, 12, '08:58', 214, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "08:58", "end": "10:10"}, {"start": "13:33", "end": "15:14"}, {"start": "16:18", "end": "16:59"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-27', '20:27', '08:13', '08:16', 12, 654, 3, '[{"time": "00:15", "duration": "15"}, {"time": "02:54", "duration": "10"}, {"time": "05:52", "duration": "15"}]', 40, 3, '09:20', 150, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:20", "end": "10:25"}, {"start": "13:27", "end": "14:52"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-28', '20:08', '07:00', '07:11', 9, 619, 2, '[{"time": "00:11", "duration": "11"}, {"time": "02:43", "duration": "13"}]', 24, 11, '09:21', 197, 4, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:21", "end": "10:43"}, {"start": "13:23", "end": "14:41"}, {"start": "16:15", "end": "16:52"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-29', '20:50', '07:52', '07:56', 12, 626, 2, '[{"time": "00:33", "duration": "6"}, {"time": "03:44", "duration": "18"}]', 24, 4, '09:52', 178, 4, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:52", "end": "11:09"}, {"start": "13:57", "end": "15:17"}, {"start": "16:41", "end": "17:02"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-30', '20:51', '08:11', '08:22', 15, 634, 2, '[{"time": "00:36", "duration": "14"}, {"time": "03:20", "duration": "17"}]', 31, 11, '09:30', 168, 4, 4, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:30", "end": "10:45"}, {"start": "13:50", "end": "15:23"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-08-31', '20:04', '07:14', '07:18', 16, 629, 2, '[{"time": "00:19", "duration": "11"}, {"time": "02:50", "duration": "14"}]', 25, 4, '09:16', 181, 5, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:16", "end": "10:06"}, {"start": "13:01", "end": "15:12"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-01', '20:04', '07:32', '07:36', 17, 651, 2, '[{"time": "00:26", "duration": "10"}, {"time": "02:53", "duration": "10"}]', 20, 4, '09:23', 160, 5, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:23", "end": "10:35"}, {"start": "13:28", "end": "14:56"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-02', '20:24', '08:10', '08:19', 8, 651, 3, '[{"time": "23:51", "duration": "17"}, {"time": "02:48", "duration": "15"}, {"time": "05:56", "duration": "15"}]', 47, 9, '09:26', 131, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:26", "end": "10:22"}, {"start": "13:25", "end": "14:40"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-03', '20:22', '07:34', '07:38', 13, 636, 1, '[{"time": "00:20", "duration": "23"}]', 23, 4, '09:28', 160, 4, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:28", "end": "10:37"}, {"start": "13:16", "end": "14:47"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-04', '20:08', '07:34', '07:40', 12, 653, 2, '[{"time": "00:06", "duration": "10"}, {"time": "02:46", "duration": "11"}]', 21, 6, '09:09', 159, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:09", "end": "10:27"}, {"start": "13:17", "end": "14:38"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-05', '20:43', '08:25', '08:30', 6, 676, 1, '[{"time": "00:49", "duration": "20"}]', 20, 5, '09:52', 217, 5, 5, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:52", "end": "11:15"}, {"start": "13:39", "end": "15:29"}, {"start": "17:01", "end": "17:25"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-06', '20:38', '08:19', '08:31', 10, 657, 3, '[{"time": "00:31", "duration": "6"}, {"time": "03:19", "duration": "14"}, {"time": "06:34", "duration": "14"}]', 34, 12, '09:58', 181, 4, 5, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:58", "end": "11:12"}, {"start": "13:23", "end": "14:45"}, {"start": "16:49", "end": "17:14"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-07', '20:27', '07:40', '07:48', 12, 647, 1, '[{"time": "00:22", "duration": "14"}]', 14, 8, '09:09', 173, 4, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:09", "end": "10:28"}, {"start": "13:09", "end": "14:43"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-08', '20:25', '07:49', '08:00', 9, 660, 1, '[{"time": "00:00", "duration": "15"}]', 15, 11, '09:30', 118, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:30", "end": "09:59"}, {"start": "13:07", "end": "14:36"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-09', '20:16', '08:05', '08:08', 17, 665, 2, '[{"time": "00:16", "duration": "11"}, {"time": "03:13", "duration": "16"}]', 27, 3, '09:33', 159, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:33", "end": "10:34"}, {"start": "13:18", "end": "14:36"}, {"start": "16:41", "end": "17:01"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-10', '20:10', '07:45', '07:48', 22, 642, 2, '[{"time": "23:52", "duration": "18"}, {"time": "03:33", "duration": "13"}]', 31, 3, '09:02', 181, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:02", "end": "10:08"}, {"start": "12:59", "end": "14:14"}, {"start": "16:29", "end": "17:09"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-11', '20:05', '08:03', '08:14', 11, 668, 3, '[{"time": "23:52", "duration": "14"}, {"time": "03:10", "duration": "14"}, {"time": "05:33", "duration": "11"}]', 39, 11, '09:25', 142, 4, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:25", "end": "10:34"}, {"start": "13:28", "end": "14:41"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-12', '20:45', '08:00', '08:07', 9, 642, 2, '[{"time": "00:55", "duration": "11"}, {"time": "03:37", "duration": "13"}]', 24, 7, '09:35', 165, 5, 5, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:35", "end": "10:32"}, {"start": "13:41", "end": "15:29"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-13', '20:43', '07:22', '07:25', 5, 613, 2, '[{"time": "00:29", "duration": "9"}, {"time": "03:37", "duration": "12"}]', 21, 3, '09:47', 174, 5, 4, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:47", "end": "11:07"}, {"start": "13:56", "end": "15:30"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-14', '20:08', '07:00', '07:09', 7, 640, 1, '[{"time": "00:04", "duration": "5"}]', 5, 9, '09:27', 180, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:27", "end": "10:26"}, {"start": "13:27", "end": "14:57"}, {"start": "16:45", "end": "17:16"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-15', '20:07', '07:17', '07:24', 14, 642, 1, '[{"time": "23:38", "duration": "14"}]', 14, 7, '09:19', 219, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:19", "end": "10:29"}, {"start": "13:28", "end": "15:12"}, {"start": "16:19", "end": "17:04"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-16', '20:15', '06:59', '07:05', 7, 617, 2, '[{"time": "00:10", "duration": "10"}, {"time": "03:13", "duration": "10"}]', 20, 6, '09:05', 172, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:05", "end": "10:13"}, {"start": "13:11", "end": "14:55"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-17', '20:22', '07:53', '07:57', 9, 638, 2, '[{"time": "23:58", "duration": "16"}, {"time": "02:48", "duration": "28"}]', 44, 4, '09:03', 196, 4, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:03", "end": "10:19"}, {"start": "13:24", "end": "15:00"}, {"start": "16:20", "end": "16:44"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-18', '20:24', '07:40', '07:48', 12, 622, 3, '[{"time": "00:34", "duration": "12"}, {"time": "03:09", "duration": "22"}, {"time": "05:51", "duration": "8"}]', 42, 8, '09:09', 140, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "09:09", "end": "10:02"}, {"start": "13:01", "end": "14:28"}]', 2),
  ('bruno.buendia@demo.dormetria.com', '2026-09-19', '20:34', '08:00', '08:03', 12, 637, 2, '[{"time": "00:08", "duration": "16"}, {"time": "03:15", "duration": "21"}]', 37, 3, '09:51', 181, 5, 5, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "09:51", "end": "10:58"}, {"start": "13:26", "end": "14:56"}, {"start": "17:06", "end": "17:30"}]', 2);

delete from public.sleep_diary where patient_email = 'olivia.sanz@demo.dormetria.com';
insert into public.sleep_diary (patient_email, diary_date, bedtime, wake_time, get_up_time, sleep_latency_mins, sleep_minutes, awakenings, awakening_detail, wake_in_bed_mins, awake_in_bed_after_mins, nap_start, nap_minutes, sleep_quality, mood, energy, day_type, screen_minutes, coffee_cups, alcohol_drinks, exercise_mins, notes, schema_version) values
  ('olivia.sanz@demo.dormetria.com', '2026-08-21', '20:39', '07:51', '07:57', 14, 658, 0, null, 0, 6, '13:38', 85, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:38", "end": "15:03"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-22', '21:22', '09:05', '09:13', 17, 686, 0, null, 0, 8, '14:02', 106, 5, 4, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:02", "end": "15:48"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-23', '21:21', '08:39', '08:46', 22, 656, 0, null, 0, 7, '14:04', 94, 5, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:04", "end": "15:38"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-24', '20:50', '08:01', '08:10', 8, 663, 0, null, 0, 9, '13:40', 74, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:40", "end": "14:54"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-25', '20:42', '07:56', '08:08', 14, 660, 0, null, 0, 12, '13:30', 98, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:30", "end": "15:08"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-26', '20:54', '07:57', '08:06', 24, 639, 0, null, 0, 9, '13:59', 88, 5, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:59", "end": "15:27"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-27', '20:36', '07:00', '07:04', 15, 609, 0, null, 0, 4, '13:33', 94, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:33", "end": "15:07"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-28', '20:53', '08:17', '08:24', 11, 673, 0, null, 0, 7, '13:48', 95, 5, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:48", "end": "15:23"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-29', '21:21', '08:30', '08:34', 16, 653, 0, null, 0, 4, '14:32', 78, 4, 5, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:32", "end": "15:50"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-30', '21:15', '09:00', '09:11', 11, 694, 0, null, 0, 11, '14:00', 90, 5, 5, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:00", "end": "15:30"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-08-31', '20:42', '07:46', '07:57', 9, 655, 0, null, 0, 11, '13:45', 85, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:45", "end": "15:10"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-01', '20:33', '07:26', '07:35', 15, 638, 0, null, 0, 9, '13:51', 86, 4, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:51", "end": "15:17"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-02', '20:45', '08:27', '08:31', 26, 676, 0, null, 0, 4, '13:41', 82, 4, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:41", "end": "15:03"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-03', '20:36', '08:20', '08:26', 16, 688, 0, null, 0, 6, '13:34', 118, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:34", "end": "15:32"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-04', '20:36', '08:13', '08:22', 15, 673, 1, '[{"time": "00:25", "duration": "9"}]', 9, 9, '13:56', 104, 5, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:56", "end": "15:40"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-05', '21:21', '09:07', '09:13', 13, 688, 1, '[{"time": "01:07", "duration": "5"}]', 5, 6, '14:27', 89, 4, 5, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:27", "end": "15:56"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-06', '21:22', '08:38', '08:44', 16, 655, 1, '[{"time": "01:46", "duration": "5"}]', 5, 6, '14:14', 76, 4, 4, 4, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:14", "end": "15:30"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-07', '20:49', '08:06', '08:09', 23, 654, 0, null, 0, 3, '13:27', 93, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:27", "end": "15:00"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-08', '20:40', '08:11', '08:16', 19, 663, 1, '[{"time": "00:41", "duration": "9"}]', 9, 5, '14:02', 98, 5, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "14:02", "end": "15:40"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-09', '20:39', '07:48', '07:52', 26, 643, 0, null, 0, 4, '13:34', 111, 5, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:34", "end": "15:25"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-10', '20:46', '07:42', '07:50', 14, 642, 0, null, 0, 8, '13:36', 74, 4, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:36", "end": "14:50"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-11', '20:57', '07:46', '07:50', 5, 644, 0, null, 0, 4, '13:56', 100, 4, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:56", "end": "15:36"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-12', '21:05', '08:24', '08:31', 10, 669, 0, null, 0, 7, '13:57', 102, 5, 4, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "13:57", "end": "15:39"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-13', '21:12', '08:23', '08:30', 16, 655, 0, null, 0, 7, '14:06', 76, 4, 5, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:06", "end": "15:22"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-14', '20:56', '08:40', '08:50', 10, 694, 0, null, 0, 10, '14:03', 73, 4, 5, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "14:03", "end": "15:16"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-15', '20:42', '07:44', '07:55', 10, 652, 0, null, 0, 11, '13:42', 106, 4, 5, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:42", "end": "15:28"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-16', '20:33', '07:58', '08:04', 12, 673, 0, null, 0, 6, '14:03', 86, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "14:03", "end": "15:29"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-17', '20:35', '08:02', '08:05', 17, 670, 0, null, 0, 3, '13:41', 88, 5, 4, 5, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "13:41", "end": "15:09"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-18', '20:38', '07:23', '07:27', 5, 640, 0, null, 0, 4, '14:01', 89, 4, 4, 4, 'work', 0, 0, 0, 0, 'Siestas: [{"start": "14:01", "end": "15:30"}]', 2),
  ('olivia.sanz@demo.dormetria.com', '2026-09-19', '21:26', '08:51', '08:56', 19, 666, 0, null, 0, 5, '14:03', 92, 5, 4, 5, 'free', 0, 0, 0, 0, 'Siestas: [{"start": "14:03", "end": "15:35"}]', 2);

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

