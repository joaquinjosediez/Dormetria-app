# Hora de fin del ejercicio · una columna

## Por qué

La higiene del sueño clásica dice "no entrenes de noche". Los dos trabajos
grandes no sostienen eso tal cual:

- **Stutz, Eiholzer & Spengler** (*Sports Med* 2019), metaanálisis de 23 ECAs:
  el ejercicio vespertino **no** empeora el sueño —aumenta algo el sueño de
  ondas lentas y la latencia de REM— **salvo** el vigoroso que termina a menos
  de **1 h** de acostarse.
- **Facer-Childs et al.** (*Nat Commun* 2025), 14.689 personas y **4.084.354
  noches** con dispositivo: hay dosis-respuesta entre intensidad, proximidad y
  deterioro del sueño. Terminando **4 h o más** antes de dormir, no se asoció
  a cambios, cualquiera fuera la intensidad.

O sea: la variable no es la franja horaria, es el **margen hasta dormir** (y la
intensidad). La franja `evening · 19 a 24` que ya guarda Dormetria mete en la
misma bolsa a quien termina 19:00 y se acuesta 00:00 —5 h de margen— y a quien
termina 22:30 y se acuesta 23:30 —1 h—. Los dos estudios dicen cosas opuestas
sobre esos dos casos.

Con `exercise_end` y el `bedtime` que ya existe, el margen se calcula solo.

## El SQL

```sql
-- ════════════════════════════════════════════════════════════════════
-- Dormetria · mod212 — dos columnas para el análisis del ejercicio
-- Idempotente: se puede correr más de una vez sin romper nada.
-- ════════════════════════════════════════════════════════════════════

-- 1 · Hora a la que TERMINÓ el ejercicio.
alter table public.sleep_diary
  add column if not exists exercise_end time;

comment on column public.sleep_diary.exercise_end is
  'Hora de fin del ejercicio. Con bedtime da el margen hasta acostarse, que es la variable asociada al efecto sobre el sueño (Stutz 2019; Facer-Childs 2025). La app la pide solo cuando exercise_time = evening.';

-- 2 · Intensidad.
alter table public.sleep_diary
  add column if not exists exercise_intensity text;

comment on column public.sleep_diary.exercise_intensity is
  'light / moderate / vigorous, por la prueba del habla: suave = caminata; moderado = podia hablar pero no cantar; intenso = le faltaba el aire para hablar.';

-- El check va aparte y con guarda. Si se escribiera pegado al ADD COLUMN
-- IF NOT EXISTS y la columna ya existiera de antes, el check no se
-- agregaría nunca y nadie se enteraría.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sleep_diary_exercise_intensity_chk'
  ) then
    alter table public.sleep_diary
      add constraint sleep_diary_exercise_intensity_chk
      check (exercise_intensity is null
             or exercise_intensity in ('light','moderate','vigorous'));
  end if;
end $$;
```

## Verificación

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'sleep_diary'
  and column_name in ('exercise_end','exercise_intensity','exercise_time','exercise_mins')
order by column_name;
```

Tienen que aparecer las cuatro. `exercise_end` como `time without time zone`
y `exercise_intensity` como `text`.


No hace falta tocar ninguna policy: `sleep_diary` ya tiene su RLS y una columna
nueva hereda las reglas de la tabla.

## Después de correrlo

1. Cargá una noche con ejercicio de noche y hora de fin. Abajo del campo tiene
   que aparecer el margen calculado.
2. Verificá que el dato llegó:

```sql
select diary_date, exercise_time, exercise_end, bedtime
from public.sleep_diary
where exercise_end is not null
order by diary_date desc
limit 10;
```

## Lo que queda funcionando

En **Hábitos y calidad reportada** hay ahora dos factores de horario:

| Factor | Compara | Cuándo aparece |
|---|---|---|
| **Ejercicio de noche** | días con ejercicio 19–24 contra días con ejercicio de mañana o tarde | ya, con lo que hay |
| **Ejercicio a menos de 4 h de la cama** | margen <4 h contra ≥4 h | cuando haya 5 noches con `exercise_end` en cada grupo |
| **Ejercicio intenso a menos de 4 h de la cama** | la combinación, contra el resto de los días con ejercicio | cuando haya 5 noches con las dos columnas |

Los dos comparan **entre días con ejercicio**, no contra los días sin: eso
aísla el horario en vez de volver a medir el ejercicio, que ya lo mide la fila
de "Actividad física".

## Lo que hay que entender de la tercera fila

Ninguno de los dos primeros factores explica solo el efecto, y por eso está el
tercero. **Stutz 2019** encontró impacto únicamente con ejercicio *vigoroso*
terminando a menos de 1 h; **Facer-Childs 2025** encontró dosis-respuesta entre
*esfuerzo* y *proximidad*. Es la combinación, no cada variable por su cuenta.

Un paciente puede entrenar todas las noches sin que se note nada porque camina;
otro puede tener un solo día malo por semana y ser el día que hace fuerza a las
22. Con un factor binario de "ejercicio de noche" los dos casos se ven iguales.

## Y algo que el diario sigue sin capturar

La **duración** entra como `exercise_mins`, pero en franjas anchas (15–20,
30–40…). Para el cruce con intensidad alcanza. Si en algún momento querés medir
carga de entrenamiento en serio —volumen por semana, progresión— eso ya es otro
instrumento y no el diario de sueño.
