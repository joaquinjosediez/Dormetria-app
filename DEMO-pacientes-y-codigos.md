# Cinco pacientes DEMO, con código

Cinco fichas listas para mandarle el código a un colega. Cada una es un
fenotipo distinto y trae **8 semanas de diario**, escalas cargadas y métricas
coherentes entre sí: si el actograma dice una cosa, el ISI dice la misma.

Son de **sólo lectura**. El colega los ve completos, pero no puede
modificarlos: así el que entra el martes encuentra lo mismo que el que entró
el lunes.

---

## Los códigos

| Código | Paciente | Qué muestra |
|---|---|---|
| **DEMO01** | Marta Demo, mujer de 47 | Insomnio de conciliación |
| **DEMO02** | Roberto Demo, varón de 61 | Despertares y sospecha de apnea |
| **DEMO03** | Lucía Demo, mujer de 23 | Retraso de fase y jet lag social |
| **DEMO04** | Elena Demo, mujer de 38 | Buen dormidor (control) |
| **DEMO05** | Diego Demo, varón de 34 | Trabajo por turnos |

El colega entra a **Vincular paciente**, pega el código de 6 caracteres y
listo. Puede cargar los cinco o sólo el que le interese.

---

## Qué es cada uno

### DEMO01 · Insomnio de conciliación

Tarda más de una hora en dormirse. Mente acelerada al acostarse. Eficiencia baja por tiempo en cama despierta, no por despertares.

| | |
|---|---|
| Noches cargadas | 44 |
| Sueño promedio | 6h 26m |
| Latencia promedio | 85 min |
| Eficiencia | 79% |
| Escalas | ISI 19, PSQI 13, GAD7 11, PHQ9 7, ESS 5, STOPBANG 1 |

**Qué mirar:**

- La latencia larga y estable: es el patrón, no un mal día.
- El ISI alto con Epworth normal: no está somnolienta, está activada.
- Buen candidato a control de estímulos y desactivación.

### DEMO02 · Despertares y sospecha de apnea

Se duerme rápido pero se despierta 3 o 4 veces. Somnolencia diurna marcada. STOP-BANG alto: acá la app tiene que levantar la alerta.

| | |
|---|---|
| Noches cargadas | 45 |
| Sueño promedio | 6h 35m |
| Latencia promedio | 14 min |
| Eficiencia | 83% |
| Escalas | ISI 16, PSQI 12, ESS 15, STOPBANG 6, GAD7 6, PHQ9 9, FSS 48 |

**Qué mirar:**

- La alerta de riesgo de apnea, que es lo que no se cobra nunca.
- Epworth 15 con latencia corta: el problema no es conciliar.
- Fragmentación alta en el actograma, visible de un vistazo.

### DEMO03 · Retraso de fase y jet lag social

Estudiante. Entre semana se acuesta a las 2 y se levanta a las 7; el fin de semana duerme hasta el mediodía. Más de 3 horas de jet lag social. El actograma lo muestra solo.

| | |
|---|---|
| Noches cargadas | 48 |
| Sueño promedio | 5h 16m |
| Latencia promedio | 22 min |
| Eficiencia | 90% |
| Escalas | ISI 13, PSQI 9, ESS 13, GAD7 8, PHQ9 10, STOPBANG 0 |

**Qué mirar:**

- El jet lag social, que es LA métrica de este caso.
- El actograma: la diferencia laboral/libre salta a la vista.
- Duerme poco entre semana y recupera el finde: no es insomnio.

### DEMO04 · Buen dormidor (control)

Duerme bien. Está para que se vea cómo se ve un diario sano y para que las comparaciones tengan contra qué compararse.

| | |
|---|---|
| Noches cargadas | 54 |
| Sueño promedio | 7h 49m |
| Latencia promedio | 12 min |
| Eficiencia | 93% |
| Escalas | ISI 4, PSQI 3, ESS 6, GAD7 2, PHQ9 2, STOPBANG 0 |

**Qué mirar:**

- Cómo se ve la app cuando NO hay nada que corregir.
- Eficiencia por encima de 90% y horarios regulares.
- Sirve de referencia al mirar a los otros cuatro.

### DEMO05 · Trabajo por turnos

Enfermero con turnos rotativos. Duerme de día algunas semanas. Muestra por qué "día libre / laboral" no se puede deducir del día de la semana y hay que dejar corregir a mano.

| | |
|---|---|
| Noches cargadas | 43 |
| Sueño promedio | 5h 29m |
| Latencia promedio | 21 min |
| Eficiencia | 86% |
| Escalas | ISI 15, PSQI 11, ESS 12, GAD7 7, PHQ9 8, FSS 41, STOPBANG 2 |

**Qué mirar:**

- Por qué la corrección manual de día libre/laboral existe.
- El actograma con sueño diurno: se ve distinto a todo el resto.
- Sueño fragmentado y corto en las semanas de turno noche.

---

## El SQL

Pegalo entero en **Supabase → SQL Editor → Run**. Se puede correr las veces
que quieras: primero borra los demo que hubiera y después los vuelve a crear.
**No toca ningún paciente real** — todo lo que hace filtra por
`@dormetria.com`.

Al final te devuelve dos tablas: una con los cinco pacientes y sus números
—para confirmar que quedaron bien— y otra con el tamaño de tu cohorte de
investigación, que **no tiene que haber cambiado**.

```sql
-- ═══════════════════════════════════════════════════════════════════
--  Dormetria · 5 pacientes DEMO representativos
--
--  Se puede correr las veces que quieras: primero borra los demo que
--  hubiera y despues los vuelve a crear. No toca ningun paciente real:
--  todo lo que hace filtra por email @dormetria.com.
--
--  Los codigos son DEMO01 a DEMO05. El colega los pega en
--  "Vincular paciente" y ya los ve.
-- ═══════════════════════════════════════════════════════════════════

alter table public.patients add column if not exists is_demo boolean default false;

-- ── Borrado previo, para que se pueda repetir ─────────────────────
delete from sleep_diary     where patient_email like '%.demo@dormetria.com';
delete from evaluations     where patient_email like '%.demo@dormetria.com';
delete from doctor_patients where patient_email like '%.demo@dormetria.com';
delete from patients        where email         like '%.demo@dormetria.com';

-- ── Las cinco fichas ──────────────────────────────────────────────
insert into patients (name, lname, email, code, dob, sex, is_demo,
                      consent_version, consent_date, consent_origen, research_consent)
values
  ('Marta', 'Demo', 'marta.demo@dormetria.com', 'DEMO01', '1979-04-12', 'F', true, 'demo', now(), 'demo', false),
  ('Roberto', 'Demo', 'roberto.demo@dormetria.com', 'DEMO02', '1965-09-30', 'M', true, 'demo', now(), 'demo', false),
  ('Lucía', 'Demo', 'lucia.demo@dormetria.com', 'DEMO03', '2003-01-22', 'F', true, 'demo', now(), 'demo', false),
  ('Elena', 'Demo', 'elena.demo@dormetria.com', 'DEMO04', '1988-11-05', 'F', true, 'demo', now(), 'demo', false),
  ('Diego', 'Demo', 'diego.demo@dormetria.com', 'DEMO05', '1992-06-18', 'M', true, 'demo', now(), 'demo', false);

-- research_consent en false a proposito: un paciente inventado no puede
-- consentir nada, y no tiene por que aparecer en ningun analisis.

-- ── Las escalas ───────────────────────────────────────────────────
insert into evaluations (patient_email, scale_id, score, max_score, interpretation, created_at)
values
  ('marta.demo@dormetria.com', 'isi', 19, 28, 'Insomnio moderado', now() - interval '40 days'),
  ('marta.demo@dormetria.com', 'psqi', 13, 21, 'Calidad de sueño patológica', now() - interval '40 days'),
  ('marta.demo@dormetria.com', 'gad7', 11, 21, 'Ansiedad moderada', now() - interval '40 days'),
  ('marta.demo@dormetria.com', 'phq9', 7, 27, 'Depresión leve', now() - interval '40 days'),
  ('marta.demo@dormetria.com', 'ess', 5, 24, 'Normal', now() - interval '40 days'),
  ('marta.demo@dormetria.com', 'stopbang', 1, 8, 'Riesgo bajo de apnea', now() - interval '40 days'),
  ('roberto.demo@dormetria.com', 'isi', 16, 28, 'Insomnio moderado', now() - interval '37 days'),
  ('roberto.demo@dormetria.com', 'psqi', 12, 21, 'Calidad de sueño patológica', now() - interval '37 days'),
  ('roberto.demo@dormetria.com', 'ess', 15, 24, 'Somnolencia moderada', now() - interval '37 days'),
  ('roberto.demo@dormetria.com', 'stopbang', 6, 8, 'Riesgo alto de apnea', now() - interval '37 days'),
  ('roberto.demo@dormetria.com', 'gad7', 6, 21, 'Ansiedad leve', now() - interval '37 days'),
  ('roberto.demo@dormetria.com', 'phq9', 9, 27, 'Depresión leve', now() - interval '37 days'),
  ('roberto.demo@dormetria.com', 'fss', 48, 63, 'Fatiga severa', now() - interval '37 days'),
  ('lucia.demo@dormetria.com', 'isi', 13, 28, 'Insomnio subumbral', now() - interval '34 days'),
  ('lucia.demo@dormetria.com', 'psqi', 9, 21, 'Calidad de sueño patológica', now() - interval '34 days'),
  ('lucia.demo@dormetria.com', 'ess', 13, 24, 'Somnolencia moderada', now() - interval '34 days'),
  ('lucia.demo@dormetria.com', 'gad7', 8, 21, 'Ansiedad leve', now() - interval '34 days'),
  ('lucia.demo@dormetria.com', 'phq9', 10, 27, 'Depresión moderada', now() - interval '34 days'),
  ('lucia.demo@dormetria.com', 'stopbang', 0, 8, 'Riesgo bajo de apnea', now() - interval '34 days'),
  ('elena.demo@dormetria.com', 'isi', 4, 28, 'Sin insomnio clínicamente significativo', now() - interval '31 days'),
  ('elena.demo@dormetria.com', 'psqi', 3, 21, 'Calidad de sueño normal', now() - interval '31 days'),
  ('elena.demo@dormetria.com', 'ess', 6, 24, 'Normal', now() - interval '31 days'),
  ('elena.demo@dormetria.com', 'gad7', 2, 21, 'Ansiedad mínima', now() - interval '31 days'),
  ('elena.demo@dormetria.com', 'phq9', 2, 27, 'Mínimo/Sin depresión', now() - interval '31 days'),
  ('elena.demo@dormetria.com', 'stopbang', 0, 8, 'Riesgo bajo de apnea', now() - interval '31 days'),
  ('diego.demo@dormetria.com', 'isi', 15, 28, 'Insomnio moderado', now() - interval '28 days'),
  ('diego.demo@dormetria.com', 'psqi', 11, 21, 'Calidad de sueño patológica', now() - interval '28 days'),
  ('diego.demo@dormetria.com', 'ess', 12, 24, 'Somnolencia moderada', now() - interval '28 days'),
  ('diego.demo@dormetria.com', 'gad7', 7, 21, 'Ansiedad leve', now() - interval '28 days'),
  ('diego.demo@dormetria.com', 'phq9', 8, 27, 'Depresión leve', now() - interval '28 days'),
  ('diego.demo@dormetria.com', 'fss', 41, 63, 'Fatiga moderada', now() - interval '28 days'),
  ('diego.demo@dormetria.com', 'stopbang', 2, 8, 'Riesgo bajo de apnea', now() - interval '28 days');

-- ── 234 noches de diario (8 semanas por paciente) ──────────────────
insert into sleep_diary (patient_email, diary_date, bedtime, get_up_time, wake_time, sleep_minutes, sleep_latency_mins, day_type, awakenings, wake_in_bed_mins, awake_in_bed_after_mins, sleep_quality, mood, energy, coffee_cups, alcohol_drinks, screen_minutes, exercise_mins, schema_version)
values
  ('marta.demo@dormetria.com', '2026-07-05', '23:11', '08:03', '08:00', 400, 116, 'free', 1, 3, 11, 6, 6, 4, 2, 0, 128, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-07', '22:42', '06:53', '06:47', 435, 48, 'work', 0, 0, 20, 6, 5, 4, 1, 1, 41, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-08', '23:27', '07:06', '06:56', 367, 74, 'work', 0, 0, 0, 5, 5, 4, 3, 0, 69, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-09', '22:53', '07:39', '07:28', 343, 139, 'work', 2, 24, 13, 5, 4, 4, 2, 0, 109, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-10', '23:34', '06:47', '06:32', 305, 108, 'work', 2, 15, 5, 5, 7, 5, 2, 0, 55, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-11', '22:57', '08:51', '08:37', 500, 68, 'free', 1, 3, 19, 6, 4, 3, 1, 0, 16, 30, 2),
  ('marta.demo@dormetria.com', '2026-07-12', '23:22', '08:29', '08:22', 489, 55, 'free', 0, 0, 9, 5, 4, 4, 2, 0, 67, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-14', '23:49', '07:05', '06:58', 372, 56, 'work', 1, 8, 8, 3, 7, 4, 2, 1, 74, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-15', '23:48', '06:43', '06:39', 341, 64, 'work', 1, 9, 16, 5, 6, 4, 1, 0, 69, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-16', '23:08', '07:00', '06:55', 367, 85, 'work', 2, 10, 18, 3, 6, 5, 1, 1, 128, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-17', '23:03', '07:05', '06:56', 365, 99, 'work', 1, 9, 6, 4, 5, 6, 2, 0, 29, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-18', '23:01', '08:27', '08:17', 457, 83, 'free', 1, 9, 8, 4, 5, 6, 1, 0, 68, 30, 2),
  ('marta.demo@dormetria.com', '2026-07-19', '22:29', '09:18', '09:09', 562, 81, 'free', 0, 0, 12, 5, 5, 6, 2, 1, 79, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-20', '23:27', '06:06', '06:05', 286, 98, 'work', 1, 9, 15, 7, 6, 8, 2, 0, 43, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-21', '23:25', '06:38', '06:28', 378, 38, 'work', 0, 0, 17, 4, 4, 5, 1, 0, 86, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-22', '23:28', '06:32', '06:22', 368, 42, 'work', 1, 5, 11, 2, 6, 2, 2, 1, 90, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-23', '22:55', '07:06', '06:59', 431, 58, 'work', 0, 0, 11, 3, 6, 4, 2, 1, 90, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-24', '23:58', '07:05', '06:57', 343, 64, 'work', 1, 7, 7, 5, 5, 3, 1, 0, 82, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-25', '23:29', '08:04', '07:56', 389, 113, 'free', 0, 0, 10, 4, 5, 6, 1, 0, 80, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-26', '23:44', '08:59', '08:50', 498, 46, 'free', 1, 6, 13, 7, 5, 6, 2, 1, 45, 30, 2),
  ('marta.demo@dormetria.com', '2026-07-27', '23:35', '07:26', '07:20', 350, 94, 'work', 1, 9, 14, 4, 6, 6, 1, 1, 65, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-28', '22:19', '06:33', '06:26', 329, 165, 'work', 0, 0, 14, 10, 5, 6, 2, 0, 80, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-29', '00:18', '06:32', '06:25', 239, 117, 'work', 1, 4, 14, 6, 4, 5, 2, 0, 109, 0, 2),
  ('marta.demo@dormetria.com', '2026-07-31', '00:03', '07:54', '07:43', 363, 81, 'work', 1, 13, 8, 5, 3, 4, 2, 0, 42, 30, 2),
  ('marta.demo@dormetria.com', '2026-08-02', '22:35', '08:47', '08:38', 523, 82, 'free', 0, 0, 11, 5, 6, 3, 2, 0, 71, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-03', '23:53', '06:56', '06:52', 330, 74, 'work', 1, 9, 11, 5, 5, 6, 2, 0, 50, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-04', '23:16', '06:44', '06:38', 359, 66, 'work', 1, 11, 15, 3, 4, 5, 2, 0, 40, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-05', '23:15', '07:31', '07:30', 363, 118, 'work', 1, 9, 5, 4, 5, 6, 2, 1, 61, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-06', '23:21', '07:21', '07:09', 393, 66, 'work', 0, 0, 14, 6, 7, 5, 1, 1, 68, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-07', '00:02', '07:17', '07:11', 320, 97, 'work', 1, 8, 25, 5, 6, 4, 1, 0, 81, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-08', '23:34', '09:02', '08:49', 457, 80, 'free', 1, 15, 10, 6, 7, 2, 2, 0, 109, 30, 2),
  ('marta.demo@dormetria.com', '2026-08-11', '22:48', '06:55', '06:43', 412, 69, 'work', 0, 0, 11, 4, 3, 4, 3, 0, 81, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-12', '23:33', '07:08', '07:00', 345, 85, 'work', 2, 8, 22, 5, 6, 4, 2, 0, 52, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-14', '23:24', '07:02', '07:00', 325, 99, 'work', 2, 12, 13, 4, 5, 4, 3, 0, 68, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-15', '23:11', '08:39', '08:35', 466, 83, 'free', 0, 0, 14, 4, 6, 5, 1, 1, 59, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-16', '23:02', '08:43', '08:39', 406, 146, 'free', 1, 12, 13, 6, 5, 6, 3, 0, 76, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-18', '23:40', '07:28', '07:25', 398, 50, 'work', 0, 0, 12, 4, 3, 3, 2, 0, 80, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-20', '23:04', '06:53', '06:47', 383, 78, 'work', 0, 0, 13, 4, 3, 5, 2, 0, 97, 30, 2),
  ('marta.demo@dormetria.com', '2026-08-22', '23:19', '08:45', '08:39', 425, 130, 'free', 0, 0, 10, 3, 7, 4, 2, 0, 113, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-23', '23:34', '08:45', '08:44', 420, 106, 'free', 1, 9, 12, 5, 4, 5, 1, 0, 65, 30, 2),
  ('marta.demo@dormetria.com', '2026-08-24', '23:20', '06:22', '06:12', 284, 117, 'work', 1, 10, 8, 5, 7, 6, 1, 1, 67, 30, 2),
  ('marta.demo@dormetria.com', '2026-08-25', '22:27', '06:24', '06:14', 386, 78, 'work', 0, 0, 15, 3, 6, 4, 1, 0, 139, 30, 2),
  ('marta.demo@dormetria.com', '2026-08-26', '22:42', '07:04', '06:57', 424, 61, 'work', 1, 3, 8, 5, 6, 3, 2, 0, 85, 0, 2),
  ('marta.demo@dormetria.com', '2026-08-27', '23:41', '06:39', '06:31', 317, 80, 'work', 1, 7, 5, 5, 5, 7, 2, 1, 56, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-04', '22:47', '07:03', '06:49', 429, 3, 'free', 4, 58, 23, 5, 4, 3, 3, 1, 35, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-05', '22:42', '07:36', '07:23', 468, 21, 'free', 3, 41, 11, 5, 7, 4, 4, 0, 53, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-06', '23:01', '06:22', '06:22', 402, 14, 'work', 5, 25, 2, 5, 4, 4, 4, 1, 89, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-07', '23:10', '05:51', '05:44', 312, 9, 'work', 5, 75, 14, 5, 5, 1, 2, 0, 73, 20, 2),
  ('roberto.demo@dormetria.com', '2026-07-09', '22:38', '06:11', '06:02', 363, 18, 'work', 2, 60, 9, 4, 3, 5, 4, 2, 51, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-10', '22:59', '07:05', '06:57', 410, 11, 'work', 3, 55, 19, 2, 6, 5, 4, 0, 33, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-11', '22:12', '07:53', '07:47', 502, 18, 'free', 3, 50, 18, 4, 4, 3, 3, 1, 32, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-12', '23:14', '08:03', '07:54', 402, 10, 'free', 4, 110, 8, 6, 4, 3, 2, 0, 61, 20, 2),
  ('roberto.demo@dormetria.com', '2026-07-15', '23:13', '06:32', '06:21', 395, 3, 'work', 4, 33, 3, 4, 5, 4, 3, 2, 64, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-16', '23:15', '06:21', '06:14', 353, 16, 'work', 5, 58, 4, 5, 5, 2, 3, 1, 56, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-17', '22:59', '06:17', '06:11', 365, 6, 'work', 4, 62, 10, 4, 4, 3, 3, 2, 25, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-19', '23:19', '07:17', '07:02', 402, 22, 'free', 2, 46, 10, 5, 6, 3, 4, 1, 17, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-21', '23:32', '06:37', '06:33', 382, 13, 'work', 3, 20, 17, 2, 3, 2, 2, 1, 46, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-23', '22:22', '06:40', '06:28', 426, 9, 'work', 4, 55, 17, 3, 4, 5, 4, 1, 59, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-24', '22:14', '06:34', '06:20', 408, 21, 'work', 3, 61, 9, 4, 6, 3, 4, 0, 57, 20, 2),
  ('roberto.demo@dormetria.com', '2026-07-25', '22:11', '06:55', '06:45', 482, 9, 'free', 4, 23, 6, 4, 5, 4, 3, 1, 47, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-26', '22:59', '07:41', '07:33', 367, 18, 'free', 5, 125, 23, 4, 5, 4, 3, 0, 60, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-27', '23:04', '06:22', '06:12', 376, 15, 'work', 2, 40, 11, 5, 5, 1, 2, 1, 70, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-28', '21:53', '06:55', '06:51', 463, 7, 'work', 5, 66, 11, 3, 4, 1, 4, 1, 44, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-29', '22:26', '07:29', '07:21', 429, 23, 'work', 4, 81, 17, 3, 7, 3, 3, 0, 52, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-30', '23:03', '06:37', '06:31', 384, 8, 'work', 4, 43, 4, 4, 6, 3, 4, 0, 67, 0, 2),
  ('roberto.demo@dormetria.com', '2026-07-31', '23:15', '06:41', '06:28', 351, 17, 'work', 4, 66, 20, 5, 5, 5, 2, 2, 43, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-01', '23:02', '07:27', '07:17', 409, 30, 'free', 3, 50, 10, 5, 7, 4, 2, 1, 20, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-02', '22:06', '07:34', '07:25', 442, 7, 'free', 5, 113, 11, 4, 6, 2, 4, 2, 66, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-03', '23:20', '06:05', '06:00', 310, 5, 'work', 5, 89, 14, 4, 6, 3, 2, 2, 26, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-04', '22:47', '06:34', '06:23', 417, 10, 'work', 5, 40, 20, 4, 7, 6, 3, 1, 41, 20, 2),
  ('roberto.demo@dormetria.com', '2026-08-06', '22:27', '06:22', '06:14', 406, 12, 'work', 2, 40, 16, 2, 4, 4, 3, 1, 22, 20, 2),
  ('roberto.demo@dormetria.com', '2026-08-07', '22:49', '06:16', '06:11', 375, 3, 'work', 5, 61, 4, 3, 5, 5, 3, 1, 42, 20, 2),
  ('roberto.demo@dormetria.com', '2026-08-08', '23:28', '07:39', '07:30', 383, 18, 'free', 5, 88, 13, 3, 4, 2, 2, 0, 61, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-09', '22:55', '07:19', '07:09', 429, 22, 'free', 4, 51, 5, 4, 6, 4, 3, 0, 75, 20, 2),
  ('roberto.demo@dormetria.com', '2026-08-10', '22:30', '06:39', '06:24', 380, 21, 'work', 3, 69, 15, 3, 4, 4, 4, 1, 35, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-12', '22:38', '05:52', '05:42', 397, 17, 'work', 3, 15, 9, 3, 4, 3, 4, 2, 61, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-13', '22:31', '06:21', '06:16', 419, 19, 'work', 4, 20, 15, 4, 6, 2, 3, 2, 22, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-14', '22:57', '06:24', '06:16', 360, 12, 'work', 3, 68, 14, 3, 4, 3, 2, 0, 31, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-15', '22:34', '07:47', '07:40', 449, 13, 'free', 5, 73, 17, 4, 5, 4, 4, 2, 16, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-16', '23:09', '07:46', '07:35', 489, 6, 'free', 2, 10, 15, 5, 6, 4, 3, 1, 71, 20, 2),
  ('roberto.demo@dormetria.com', '2026-08-17', '23:31', '06:00', '05:54', 292, 19, 'work', 5, 78, 5, 4, 4, 3, 2, 1, 26, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-18', '22:51', '06:06', '06:03', 325, 26, 'work', 4, 65, 17, 5, 6, 3, 3, 0, 35, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-19', '23:04', '06:08', '06:03', 343, 25, 'work', 3, 39, 8, 3, 4, 3, 3, 1, 66, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-20', '22:44', '06:37', '06:32', 371, 17, 'work', 3, 65, 7, 3, 6, 3, 3, 2, 55, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-21', '22:41', '06:38', '06:32', 405, 13, 'work', 2, 48, 8, 5, 7, 3, 3, 1, 39, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-22', '22:48', '07:56', '07:48', 403, 10, 'free', 3, 117, 8, 5, 4, 3, 3, 1, 45, 20, 2),
  ('roberto.demo@dormetria.com', '2026-08-23', '22:58', '06:59', '06:48', 384, 28, 'free', 3, 57, 9, 3, 5, 2, 2, 1, 33, 0, 2),
  ('roberto.demo@dormetria.com', '2026-08-26', '23:01', '06:49', '06:40', 396, 8, 'work', 3, 52, 14, 4, 4, 2, 2, 0, 43, 20, 2),
  ('roberto.demo@dormetria.com', '2026-08-27', '22:58', '05:43', '05:32', 359, 7, 'work', 3, 34, 10, 3, 6, 2, 3, 2, 57, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-04', '02:58', '11:13', '11:11', 477, 16, 'free', 0, 0, 13, 7, 5, 6, 1, 0, 165, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-05', '02:34', '12:41', '12:37', 572, 20, 'free', 1, 8, 9, 5, 6, 5, 4, 1, 149, 45, 2),
  ('lucia.demo@dormetria.com', '2026-07-06', '01:48', '07:16', '07:05', 303, 18, 'work', 0, 0, 6, 4, 7, 1, 4, 0, 260, 45, 2),
  ('lucia.demo@dormetria.com', '2026-07-07', '02:44', '07:30', '07:17', 236, 25, 'work', 1, 13, 11, 6, 7, 6, 2, 0, 153, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-08', '02:23', '07:32', '07:26', 285, 18, 'work', 0, 0, 7, 3, 3, 3, 3, 0, 205, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-09', '01:59', '07:09', '07:00', 267, 30, 'work', 0, 0, 11, 6, 8, 4, 2, 0, 109, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-12', '04:38', '11:21', '11:14', 355, 34, 'free', 0, 0, 12, 6, 6, 7, 2, 2, 122, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-13', '01:39', '07:03', '06:53', 278, 32, 'work', 0, 0, 7, 7, 2, 5, 2, 0, 113, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-14', '01:33', '06:49', '06:39', 304, 5, 'work', 0, 0, 10, 4, 5, 4, 1, 0, 60, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-16', '02:25', '06:48', '06:35', 246, 11, 'work', 1, 4, 6, 6, 4, 6, 1, 0, 184, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-17', '02:20', '06:33', '06:26', 232, 13, 'work', 1, 7, 17, 3, 5, 5, 1, 0, 65, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-18', '03:01', '11:25', '11:10', 458, 30, 'free', 1, 3, 19, 7, 4, 5, 3, 1, 198, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-20', '01:36', '06:46', '06:37', 293, 14, 'work', 0, 0, 7, 5, 6, 4, 2, 0, 121, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-21', '02:03', '07:24', '07:13', 308, 6, 'work', 0, 0, 9, 5, 6, 8, 4, 0, 140, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-22', '02:34', '07:12', '07:04', 257, 5, 'work', 1, 9, 6, 5, 6, 5, 1, 0, 203, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-23', '02:10', '06:53', '06:43', 250, 25, 'work', 0, 0, 19, 6, 5, 6, 2, 0, 163, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-24', '03:03', '07:03', '06:54', 209, 19, 'work', 0, 0, 14, 4, 6, 4, 2, 0, 198, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-25', '04:03', '12:06', '12:01', 439, 36, 'free', 0, 0, 20, 4, 3, 5, 4, 1, 151, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-26', '03:16', '11:46', '11:40', 476, 26, 'free', 0, 0, 10, 6, 5, 5, 4, 1, 122, 45, 2),
  ('lucia.demo@dormetria.com', '2026-07-27', '03:00', '07:24', '07:16', 231, 22, 'work', 0, 0, 14, 7, 6, 6, 1, 0, 138, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-28', '02:20', '07:47', '07:44', 310, 6, 'work', 0, 0, 12, 7, 6, 4, 2, 0, 184, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-29', '01:37', '06:34', '06:25', 272, 16, 'work', 0, 0, 4, 7, 5, 6, 2, 0, 126, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-30', '02:58', '07:29', '07:18', 235, 21, 'work', 1, 10, 3, 4, 5, 5, 4, 0, 124, 0, 2),
  ('lucia.demo@dormetria.com', '2026-07-31', '02:07', '07:17', '07:11', 298, 5, 'work', 0, 0, 20, 5, 8, 4, 2, 0, 222, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-01', '03:06', '11:32', '11:27', 475, 21, 'free', 0, 0, 12, 4, 4, 5, 1, 1, 156, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-03', '03:45', '07:19', '07:14', 182, 28, 'work', 0, 0, 2, 5, 5, 3, 2, 0, 180, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-04', '02:59', '07:29', '07:22', 226, 38, 'work', 0, 0, 15, 5, 5, 5, 2, 0, 119, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-05', '02:04', '06:58', '06:55', 268, 14, 'work', 0, 0, 3, 6, 5, 6, 1, 0, 175, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-06', '02:02', '07:26', '07:16', 284, 29, 'work', 0, 0, 0, 7, 6, 5, 4, 0, 156, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-07', '02:54', '06:55', '06:47', 214, 16, 'work', 1, 8, 0, 6, 6, 7, 1, 0, 159, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-08', '04:49', '12:16', '12:06', 400, 35, 'free', 0, 0, 17, 8, 7, 6, 2, 0, 168, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-09', '02:13', '13:53', '13:48', 684, 11, 'free', 0, 0, 15, 6, 6, 8, 2, 1, 244, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-10', '01:56', '07:11', '07:09', 263, 38, 'work', 0, 0, 17, 6, 6, 4, 4, 0, 148, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-11', '02:34', '07:43', '07:30', 264, 43, 'work', 0, 0, 8, 7, 5, 2, 2, 0, 159, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-12', '01:18', '06:53', '06:46', 295, 34, 'work', 0, 0, 9, 7, 10, 7, 2, 0, 181, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-13', '02:05', '07:04', '06:57', 264, 27, 'work', 0, 0, 19, 7, 6, 3, 3, 0, 157, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-14', '02:01', '07:16', '07:03', 276, 34, 'work', 0, 0, 6, 4, 6, 6, 1, 0, 191, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-15', '04:04', '11:34', '11:25', 420, 20, 'free', 1, 4, 14, 5, 5, 4, 2, 0, 145, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-16', '03:58', '11:45', '11:36', 429, 24, 'free', 0, 0, 15, 7, 7, 5, 3, 1, 184, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-17', '02:33', '06:57', '06:42', 238, 19, 'work', 0, 0, 11, 6, 6, 6, 2, 0, 121, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-19', '02:05', '07:28', '07:13', 301, 12, 'work', 1, 2, 5, 4, 5, 4, 4, 0, 148, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-20', '02:14', '07:20', '07:08', 268, 30, 'work', 0, 0, 20, 6, 4, 7, 2, 0, 228, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-21', '02:52', '07:26', '07:25', 236, 20, 'work', 1, 2, 9, 5, 4, 4, 1, 0, 130, 0, 2),
  ('lucia.demo@dormetria.com', '2026-08-22', '03:07', '11:17', '11:13', 456, 24, 'free', 0, 0, 14, 5, 6, 4, 2, 0, 226, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-23', '03:48', '11:09', '11:02', 408, 25, 'free', 0, 0, 23, 9, 7, 5, 4, 0, 99, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-24', '02:40', '07:08', '07:04', 225, 29, 'work', 0, 0, 11, 6, 6, 6, 4, 0, 132, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-25', '01:35', '07:01', '06:58', 300, 14, 'work', 0, 0, 7, 8, 1, 6, 2, 0, 155, 45, 2),
  ('lucia.demo@dormetria.com', '2026-08-27', '01:56', '06:26', '06:18', 245, 20, 'work', 0, 0, 11, 6, 5, 4, 3, 0, 187, 0, 2),
  ('elena.demo@dormetria.com', '2026-07-04', '23:30', '08:01', '07:57', 474, 15, 'free', 0, 0, 12, 8, 8, 7, 2, 1, 26, 30, 2),
  ('elena.demo@dormetria.com', '2026-07-05', '22:46', '08:30', '08:28', 552, 11, 'free', 0, 0, 13, 7, 6, 7, 2, 0, 46, 40, 2),
  ('elena.demo@dormetria.com', '2026-07-06', '23:02', '06:48', '06:42', 432, 20, 'work', 0, 0, 5, 8, 6, 8, 0, 1, 28, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-07', '22:57', '06:40', '06:35', 425, 10, 'work', 0, 0, 14, 9, 7, 6, 1, 0, 42, 30, 2),
  ('elena.demo@dormetria.com', '2026-07-08', '23:22', '06:59', '06:56', 425, 16, 'work', 0, 0, 16, 7, 8, 7, 1, 0, 34, 45, 2),
  ('elena.demo@dormetria.com', '2026-07-09', '22:52', '06:42', '06:36', 436, 13, 'work', 0, 0, 23, 6, 7, 6, 1, 0, 56, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-10', '23:31', '06:45', '06:34', 403, 6, 'work', 0, 0, 9, 9, 7, 6, 1, 0, 22, 45, 2),
  ('elena.demo@dormetria.com', '2026-07-11', '22:48', '08:08', '07:57', 528, 11, 'free', 0, 0, 12, 8, 8, 8, 1, 0, 31, 0, 2),
  ('elena.demo@dormetria.com', '2026-07-12', '22:38', '08:20', '08:10', 560, 9, 'free', 0, 0, 18, 8, 8, 7, 0, 0, 27, 30, 2),
  ('elena.demo@dormetria.com', '2026-07-13', '22:33', '07:20', '07:18', 495, 19, 'work', 0, 0, 6, 8, 8, 7, 1, 1, 29, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-14', '23:13', '06:39', '06:23', 420, 3, 'work', 1, 7, 15, 8, 8, 8, 1, 0, 48, 45, 2),
  ('elena.demo@dormetria.com', '2026-07-16', '22:39', '06:53', '06:40', 465, 9, 'work', 0, 0, 15, 9, 7, 9, 2, 1, 31, 45, 2),
  ('elena.demo@dormetria.com', '2026-07-17', '22:45', '07:28', '07:15', 493, 11, 'work', 1, 9, 4, 10, 7, 7, 0, 0, 36, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-18', '22:38', '08:24', '08:18', 559, 18, 'free', 0, 0, 11, 8, 8, 8, 1, 0, 46, 0, 2),
  ('elena.demo@dormetria.com', '2026-07-19', '22:00', '08:11', '08:07', 574, 10, 'free', 0, 0, 8, 9, 9, 8, 2, 1, 23, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-20', '23:06', '06:24', '06:21', 410, 8, 'work', 0, 0, 19, 6, 7, 9, 0, 0, 57, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-21', '23:40', '06:08', '05:48', 359, 13, 'work', 0, 0, 11, 8, 7, 7, 2, 1, 32, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-22', '23:13', '07:14', '07:00', 449, 6, 'work', 1, 7, 0, 8, 8, 7, 1, 0, 54, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-23', '22:14', '06:58', '06:44', 478, 17, 'work', 1, 10, 9, 8, 8, 8, 2, 0, 31, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-24', '22:58', '06:48', '06:40', 444, 14, 'work', 0, 0, 14, 6, 7, 6, 0, 1, 26, 30, 2),
  ('elena.demo@dormetria.com', '2026-07-25', '22:47', '07:53', '07:42', 519, 9, 'free', 0, 0, 2, 8, 9, 9, 1, 0, 21, 40, 2),
  ('elena.demo@dormetria.com', '2026-07-26', '23:10', '08:21', '08:11', 513, 20, 'free', 1, 7, 13, 6, 7, 8, 1, 1, 41, 30, 2),
  ('elena.demo@dormetria.com', '2026-07-27', '23:18', '06:44', '06:35', 418, 14, 'work', 0, 0, 11, 6, 7, 7, 2, 0, 50, 40, 2),
  ('elena.demo@dormetria.com', '2026-07-28', '22:39', '06:55', '06:48', 468, 14, 'work', 0, 0, 10, 7, 6, 8, 0, 0, 39, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-29', '23:01', '06:42', '06:37', 417, 13, 'work', 0, 0, 12, 6, 8, 8, 0, 0, 40, 0, 2),
  ('elena.demo@dormetria.com', '2026-07-30', '23:10', '06:49', '06:37', 401, 18, 'work', 1, 8, 6, 8, 7, 8, 1, 1, 45, 60, 2),
  ('elena.demo@dormetria.com', '2026-07-31', '23:16', '06:38', '06:34', 423, 5, 'work', 0, 0, 14, 8, 8, 7, 1, 1, 49, 45, 2),
  ('elena.demo@dormetria.com', '2026-08-01', '22:55', '07:29', '07:26', 473, 13, 'free', 0, 0, 7, 8, 6, 9, 0, 0, 58, 40, 2),
  ('elena.demo@dormetria.com', '2026-08-02', '23:08', '08:17', '08:13', 516, 11, 'free', 0, 0, 15, 8, 7, 7, 1, 0, 43, 45, 2),
  ('elena.demo@dormetria.com', '2026-08-03', '22:50', '06:45', '06:36', 444, 7, 'work', 0, 0, 6, 8, 5, 7, 2, 0, 33, 40, 2),
  ('elena.demo@dormetria.com', '2026-08-04', '22:53', '07:31', '07:24', 479, 13, 'work', 0, 0, 14, 6, 6, 7, 1, 0, 10, 45, 2),
  ('elena.demo@dormetria.com', '2026-08-05', '22:41', '06:36', '06:31', 440, 3, 'work', 1, 6, 24, 8, 7, 9, 2, 0, 59, 60, 2),
  ('elena.demo@dormetria.com', '2026-08-06', '23:10', '06:59', '06:53', 431, 17, 'work', 0, 0, 4, 8, 5, 8, 2, 1, 46, 60, 2),
  ('elena.demo@dormetria.com', '2026-08-07', '22:42', '07:14', '07:05', 479, 10, 'work', 1, 6, 8, 9, 8, 7, 1, 0, 7, 60, 2),
  ('elena.demo@dormetria.com', '2026-08-08', '22:35', '07:54', '07:54', 523, 19, 'free', 0, 0, 27, 9, 6, 7, 1, 0, 26, 60, 2),
  ('elena.demo@dormetria.com', '2026-08-09', '23:02', '08:35', '08:27', 536, 9, 'free', 0, 0, 14, 8, 8, 6, 1, 0, 26, 45, 2),
  ('elena.demo@dormetria.com', '2026-08-10', '23:38', '07:05', '06:59', 432, 3, 'work', 0, 0, 0, 8, 9, 8, 1, 0, 45, 60, 2),
  ('elena.demo@dormetria.com', '2026-08-11', '23:05', '07:20', '07:08', 467, 10, 'work', 1, 6, 9, 8, 7, 9, 1, 0, 43, 40, 2),
  ('elena.demo@dormetria.com', '2026-08-12', '22:51', '07:09', '07:04', 481, 11, 'work', 0, 0, 6, 8, 8, 7, 1, 0, 18, 40, 2),
  ('elena.demo@dormetria.com', '2026-08-14', '22:58', '07:22', '07:16', 481, 8, 'work', 0, 0, 17, 7, 8, 8, 0, 0, 48, 45, 2),
  ('elena.demo@dormetria.com', '2026-08-15', '23:08', '08:45', '08:40', 546, 8, 'free', 0, 0, 17, 7, 6, 10, 1, 0, 39, 60, 2),
  ('elena.demo@dormetria.com', '2026-08-16', '23:02', '08:05', '07:51', 508, 19, 'free', 0, 0, 13, 8, 7, 7, 0, 0, 33, 30, 2),
  ('elena.demo@dormetria.com', '2026-08-17', '22:59', '06:52', '06:46', 438, 9, 'work', 0, 0, 5, 7, 7, 9, 2, 0, 53, 40, 2),
  ('elena.demo@dormetria.com', '2026-08-18', '23:30', '07:09', '07:00', 415, 18, 'work', 0, 0, 11, 8, 9, 7, 0, 1, 46, 0, 2),
  ('elena.demo@dormetria.com', '2026-08-19', '23:09', '06:52', '06:36', 434, 12, 'work', 0, 0, 11, 7, 7, 6, 2, 0, 45, 45, 2),
  ('elena.demo@dormetria.com', '2026-08-20', '22:59', '07:10', '06:59', 455, 15, 'work', 0, 0, 3, 7, 8, 8, 1, 1, 10, 0, 2),
  ('elena.demo@dormetria.com', '2026-08-21', '22:49', '07:26', '07:13', 505, 7, 'work', 0, 0, 19, 8, 8, 9, 2, 0, 21, 0, 2),
  ('elena.demo@dormetria.com', '2026-08-22', '23:15', '08:46', '08:44', 543, 9, 'free', 0, 0, 17, 8, 8, 8, 1, 0, 29, 0, 2),
  ('elena.demo@dormetria.com', '2026-08-23', '23:09', '08:21', '08:08', 517, 8, 'free', 1, 5, 12, 8, 7, 9, 1, 1, 43, 0, 2),
  ('elena.demo@dormetria.com', '2026-08-24', '22:45', '06:51', '06:46', 440, 18, 'work', 1, 9, 14, 8, 9, 8, 0, 0, 52, 0, 2),
  ('elena.demo@dormetria.com', '2026-08-25', '23:01', '06:29', '06:25', 413, 19, 'work', 0, 0, 15, 8, 8, 8, 1, 1, 27, 45, 2),
  ('elena.demo@dormetria.com', '2026-08-26', '22:43', '07:12', '07:02', 467, 17, 'work', 0, 0, 10, 7, 7, 8, 1, 0, 33, 45, 2),
  ('elena.demo@dormetria.com', '2026-08-27', '22:53', '07:11', '07:09', 456, 18, 'work', 0, 0, 6, 8, 7, 8, 1, 0, 31, 45, 2),
  ('elena.demo@dormetria.com', '2026-08-28', '22:55', '07:36', '07:27', 484, 11, 'work', 1, 3, 18, 8, 7, 7, 0, 0, 50, 60, 2),
  ('diego.demo@dormetria.com', '2026-07-04', '22:26', '06:06', '05:57', 407, 13, 'work', 3, 32, 3, 8, 6, 6, 3, 0, 66, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-06', '22:26', '05:35', '05:31', 349, 53, 'free', 2, 18, 10, 6, 5, 4, 3, 1, 62, 30, 2),
  ('diego.demo@dormetria.com', '2026-07-07', '22:04', '05:43', '05:36', 404, 37, 'work', 1, 11, 15, 5, 5, 7, 5, 1, 40, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-08', '00:33', '05:02', '04:51', 242, 14, 'work', 1, 3, 22, 5, 5, 7, 5, 0, 51, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-09', '00:09', '07:22', '07:12', 378, 10, 'work', 3, 38, 9, 5, 6, 6, 4, 1, 80, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-10', '23:02', '06:55', '06:45', 435, 16, 'work', 2, 14, 19, 5, 4, 6, 4, 0, 49, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-11', '00:40', '06:34', '06:14', 310, 15, 'work', 1, 10, 11, 4, 6, 5, 2, 0, 53, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-12', '23:46', '05:49', '05:36', 337, 13, 'free', 1, 3, 7, 5, 6, 6, 2, 1, 36, 30, 2),
  ('diego.demo@dormetria.com', '2026-07-13', '23:24', '06:24', '06:16', 371, 18, 'free', 2, 8, 9, 6, 6, 5, 4, 0, 64, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-14', '22:43', '06:55', '06:49', 448, 14, 'work', 1, 19, 25, 5, 4, 5, 3, 0, 46, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-16', '23:21', '06:33', '06:17', 371, 19, 'work', 3, 37, 5, 4, 3, 5, 4, 1, 106, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-17', '08:28', '15:54', '15:54', 349, 20, 'work', 3, 72, 17, 7, 5, 3, 2, 1, 71, 30, 2),
  ('diego.demo@dormetria.com', '2026-07-18', '06:52', '14:00', '13:57', 375, 5, 'work', 2, 30, 13, 5, 5, 2, 3, 0, 66, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-19', '22:16', '06:41', '06:27', 448, 25, 'free', 2, 23, 10, 5, 6, 4, 3, 1, 75, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-20', '23:32', '05:31', '05:22', 324, 5, 'free', 3, 21, 20, 8, 5, 4, 3, 1, 121, 30, 2),
  ('diego.demo@dormetria.com', '2026-07-21', '07:29', '14:13', '13:57', 338, 36, 'work', 2, 21, 9, 5, 6, 2, 2, 0, 64, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-22', '08:45', '14:01', '13:48', 261, 22, 'work', 1, 21, 2, 4, 5, 3, 5, 1, 78, 30, 2),
  ('diego.demo@dormetria.com', '2026-07-23', '09:08', '13:27', '13:17', 227, 26, 'work', 1, 4, 12, 2, 7, 2, 3, 0, 61, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-24', '08:52', '14:21', '14:20', 233, 25, 'work', 3, 59, 7, 4, 4, 2, 4, 1, 79, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-26', '00:16', '05:35', '05:26', 283, 12, 'free', 2, 6, 2, 6, 3, 4, 3, 0, 74, 30, 2),
  ('diego.demo@dormetria.com', '2026-07-28', '08:38', '13:59', '13:57', 274, 7, 'work', 3, 26, 8, 7, 4, 4, 3, 0, 42, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-29', '07:41', '14:00', '13:45', 305, 37, 'work', 3, 35, 20, 3, 5, 4, 3, 0, 48, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-30', '08:47', '15:09', '15:01', 327, 26, 'work', 1, 17, 5, 4, 5, 4, 5, 0, 62, 0, 2),
  ('diego.demo@dormetria.com', '2026-07-31', '00:42', '05:25', '05:23', 232, 13, 'work', 1, 23, 13, 5, 6, 5, 4, 0, 42, 30, 2),
  ('diego.demo@dormetria.com', '2026-08-01', '23:42', '05:56', '05:46', 316, 5, 'work', 3, 37, 4, 5, 3, 5, 5, 1, 62, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-02', '00:41', '06:28', '06:21', 259, 37, 'free', 2, 35, 3, 7, 6, 6, 5, 0, 79, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-03', '00:42', '06:33', '06:24', 300, 31, 'free', 2, 7, 19, 4, 4, 5, 5, 0, 33, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-04', '22:38', '05:58', '05:56', 400, 24, 'work', 2, 8, 25, 5, 5, 4, 4, 1, 29, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-06', '23:22', '07:53', '07:42', 446, 6, 'work', 3, 50, 14, 7, 5, 5, 3, 0, 48, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-08', '23:35', '05:21', '05:17', 301, 10, 'work', 2, 34, 14, 7, 4, 5, 5, 0, 25, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-09', '00:23', '05:58', '05:44', 292, 5, 'free', 2, 27, 4, 4, 6, 4, 2, 1, 67, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-10', '23:06', '05:18', '05:15', 341, 6, 'free', 2, 22, 4, 5, 8, 6, 5, 0, 54, 30, 2),
  ('diego.demo@dormetria.com', '2026-08-11', '00:32', '05:53', '05:47', 295, 9, 'work', 1, 14, 3, 7, 6, 6, 3, 0, 53, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-13', '23:57', '05:36', '05:33', 280, 30, 'work', 2, 17, 2, 6, 5, 6, 3, 0, 83, 30, 2),
  ('diego.demo@dormetria.com', '2026-08-15', '09:11', '15:27', '15:17', 330, 23, 'work', 1, 18, 18, 3, 7, 2, 4, 0, 54, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-16', '23:20', '06:56', '06:43', 378, 45, 'free', 2, 29, 9, 6, 5, 7, 2, 0, 71, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-17', '00:10', '06:40', '06:32', 376, 9, 'free', 2, 6, 11, 4, 5, 6, 4, 1, 44, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-18', '08:42', '14:23', '14:12', 324, 12, 'work', 1, 3, 8, 3, 5, 3, 3, 1, 74, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-20', '09:11', '14:13', '14:07', 253, 26, 'work', 2, 17, 8, 5, 5, 4, 2, 0, 36, 30, 2),
  ('diego.demo@dormetria.com', '2026-08-21', '07:27', '12:06', '12:03', 214, 39, 'work', 2, 18, 8, 5, 6, 3, 3, 1, 61, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-23', '23:40', '05:54', '05:46', 311, 24, 'free', 2, 29, 3, 6, 5, 7, 3, 0, 99, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-24', '22:36', '06:49', '06:40', 433, 45, 'free', 3, 9, 2, 6, 5, 5, 4, 0, 85, 0, 2),
  ('diego.demo@dormetria.com', '2026-08-27', '09:58', '15:49', '15:36', 308, 20, 'work', 1, 14, 5, 3, 4, 3, 2, 0, 79, 0, 2);

-- ── Que no se puedan modificar ────────────────────────────────────
--  RESTRICTIVE es la clave: las politicas normales se suman entre si
--  (alcanza que UNA permita), las restrictivas se cruzan (tienen que
--  permitir TODAS). Sin "as restrictive" esto no bloquearia nada.

alter table public.patients   enable row level security;
alter table public.sleep_diary enable row level security;

drop policy if exists demo_pacientes_no_se_tocan on public.patients;
create policy demo_pacientes_no_se_tocan on public.patients
  as restrictive for update to authenticated
  using (coalesce(is_demo, false) = false);

drop policy if exists demo_pacientes_no_se_borran on public.patients;
create policy demo_pacientes_no_se_borran on public.patients
  as restrictive for delete to authenticated
  using (coalesce(is_demo, false) = false);

drop policy if exists demo_diario_no_se_toca on public.sleep_diary;
create policy demo_diario_no_se_toca on public.sleep_diary
  as restrictive for update to authenticated
  using (patient_email not like '%.demo@dormetria.com');

drop policy if exists demo_diario_no_se_borra on public.sleep_diary;
create policy demo_diario_no_se_borra on public.sleep_diary
  as restrictive for delete to authenticated
  using (patient_email not like '%.demo@dormetria.com');

drop policy if exists demo_diario_no_se_agrega on public.sleep_diary;
create policy demo_diario_no_se_agrega on public.sleep_diary
  as restrictive for insert to authenticated
  with check (patient_email not like '%.demo@dormetria.com');

-- Vincularse SI se puede: es lo que hace el colega con el codigo.

-- ── Y que no ensucien la investigacion ────────────────────────────
create or replace view research_cohort as
select
  encode(digest(lower(p.email) || 'dormetria-research-v1', 'sha256'), 'hex') as subject_id,
  p.sex,
  case when nullif(trim(p.dob),'') ~ '^\d{4}-\d{2}-\d{2}$'
       then date_part('year', age(p.dob::date))::int end as edad,
  p.consent_version, p.consent_date, p.consent_origen
from   patients p
where  p.parent_email is null
  and  coalesce(p.is_demo, false) = false      -- <<< los demo quedan afuera
  and  p.email not like '%@dormetria.com'      -- <<< y cualquier cuenta de prueba
  and  p.consent_version  is not null
  and  p.research_consent is true
  and  p.research_withdrawn_date is null;

notify pgrst, 'reload schema';

-- ── Para comprobar que quedo bien ─────────────────────────────────
select p.code, p.name || ' ' || p.lname as paciente,
       count(d.*)                                  as noches,
       round(avg(d.sleep_minutes)/60.0, 1)         as horas_promedio,
       round(avg(d.sleep_latency_mins))            as latencia_min,
       round(avg(d.sleep_quality), 1)              as calidad
from   patients p
left join sleep_diary d on lower(d.patient_email) = lower(p.email)
where  p.is_demo is true
group  by p.code, p.name, p.lname
order  by p.code;

-- Y que la cohorte de investigacion siga limpia:
select count(*) as sujetos_de_investigacion from research_cohort;
```

---

## Dos cosas que te conviene saber

**Los demo quedan fuera de investigación, y no por un filtro que hay que
acordarse de poner.** La vista `research_cohort` ahora los excluye por
`is_demo` y además por el dominio del mail. Si no hiciera eso, cinco pacientes
inventados con 234 noches perfectamente correlacionadas entrarían a tus
análisis y te moverían los números — con 92 pacientes reales, cinco falsos no
son despreciables.

**Lo de "sólo lectura" depende de una palabra.** Las políticas usan
`as restrictive`. Las políticas normales de Postgres se **suman** (alcanza con
que una permita), las restrictivas se **cruzan** (tienen que permitir todas).
Sin esa palabra las políticas no bloquearían nada y el bloqueo sería
decorativo. Después de correrlo, probá editar un demo desde tu cuenta: tiene
que fallar.

---

## Lo que no puedo verificar desde acá

Corrí el script contra el parser de Postgres y lo acepta entero, y revisé las
234 noches una por una: ninguna tiene un sueño más largo que el tiempo en
cama, ni fechas repetidas, ni valores fuera de rango. Pero **no tengo acceso a
tu base**, así que hay dos cosas que sólo vas a saber al correrlo:

1. Si algún nombre de columna de `sleep_diary` no coincide, el insert falla
   entero y no se crea nada. Mandame el error tal cual y lo corrijo.
2. Si la función `find_patient_by_code` filtra por algo más que el código
   —por ejemplo que el paciente tenga cuenta creada—, los demo no van a
   aparecer al vincular. Probá con DEMO01 desde tu perfil profesional apenas
   lo corras.