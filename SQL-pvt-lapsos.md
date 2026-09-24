# Test de alerta · cuatro columnas, y un error de validez

## Lo que estaba mal, antes del SQL

El umbral de lapso estaba fijo en **500 ms para las tres duraciones**:

```js
const lapses = S.pvtRTs.filter(r => r > 500).length;
```

**[Seguro]** Ese no es el umbral del PVT corto. **Basner M, Mollicone D,
Dinges DF. Validity and sensitivity of a brief psychomotor vigilance test
(PVT-B) to total and partial sleep deprivation. *Acta Astronautica*
2011;69(11-12):949-959.** Bajaron el corte a **355 ms** para el PVT-B de 3
minutos, justamente porque el test es más corto y más rápido: con 500 ms se
subcuentan dramáticamente las fallas atencionales. Con 355, la sensibilidad
al déficit de sueño iguala a la del PVT de 10 minutos.

O sea: **el test de 3 minutos venía informando menos lapsos de los que hubo.**
No era un problema de presentación — el número estaba mal, y con él el
`alert_score`, que resta 8 puntos por lapso.

Ya está corregido en el código. Este SQL es para que el dato quede
interpretable hacia adelante.

## Por qué hacen falta las columnas

Sin ellas, un registro viejo no se puede leer: *¿esos dos lapsos son sobre 500
ms o sobre 355?* Y las respuestas de más de un segundo se estaban
**descartando en silencio** — el promedio filtra `r <= 1000` y nadie las
contaba en ningún lado.

```sql
-- ════════════════════════════════════════════════════════════════════
-- Dormetria · mod213 — que un test de alerta se pueda interpretar
-- Idempotente.
-- ════════════════════════════════════════════════════════════════════

alter table public.pvt_tests
  add column if not exists duration_min       int,
  add column if not exists lapse_threshold_ms int,
  add column if not exists long_lapses        int,
  add column if not exists n_responses        int;

comment on column public.pvt_tests.duration_min is
  'Duracion del test en minutos. Define el umbral de lapso.';

comment on column public.pvt_tests.lapse_threshold_ms is
  'Umbral usado para contar lapsos: 355 ms en el PVT-B de 3 min (Basner, Mollicone y Dinges 2011), 500 ms en los de 5 y 10. Sin este dato, la columna lapses no se puede comparar entre tests de distinta duracion.';

comment on column public.pvt_tests.long_lapses is
  'Respuestas de mas de 1000 ms. Quedan fuera del tiempo de reaccion medio, asi que si no se cuentan aca desaparecen.';

comment on column public.pvt_tests.n_responses is
  'Cantidad de respuestas registradas en la sesion.';
```

## Rellenar lo que se pueda de los registros viejos

La duración venía guardada dentro del texto de `alert_level`, entre
paréntesis: *"Alerta normal (5min)"*. Se puede recuperar.

**Primero mirá qué va a tocar:**

```sql
select alert_level,
       substring(alert_level from '\((\d+)\s*min\)') as dur_detectada,
       count(*)
from public.pvt_tests
where duration_min is null
group by 1, 2
order by 3 desc;
```

**Después, si las duraciones detectadas tienen sentido:**

```sql
update public.pvt_tests
set duration_min = substring(alert_level from '\((\d+)\s*min\)')::int
where duration_min is null
  and alert_level ~ '\(\d+\s*min\)';

-- El umbral con el que se contaron esos lapsos fue 500 en TODOS los casos,
-- porque es lo que hacía el código. Se deja escrito tal cual: cambiarlo a
-- 355 para los de 3 min seria reescribir la historia, porque el recuento ya
-- se hizo con 500 y el dato crudo de cada reaccion no se guarda.
update public.pvt_tests
set lapse_threshold_ms = 500
where lapse_threshold_ms is null;
```

> **Esto importa.** Los tests de 3 minutos anteriores a mod213 tienen los
> lapsos contados con 500 ms y **no se pueden corregir**: no guardamos los
> tiempos de reacción individuales, solo el conteo. Van a subestimar. El
> panel del profesional avisa cuando hay duraciones mezcladas, pero para
> comparar antes y después de este cambio conviene mirar el tiempo de
> reacción medio, que no depende del umbral.

## Verificación

```sql
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='pvt_tests'
  and column_name in ('duration_min','lapse_threshold_ms','long_lapses','n_responses')
order by column_name;
```

## Lo que NO hay que agregar, y conviene dejar escrito

Busqué umbrales de PVT para aptitud de conducción. **No existe uno validado.**
Lo que hay son umbrales **operacionales**, definidos por cada organización
para su propio contexto —por ejemplo, 12 errores entre lapsos y arranques
falsos en una operación de transporte aeromédico— y que no se pueden
trasladar a una persona cualquiera en un auto.

Tampoco es cierto que un solo lapso desaconseje conducir: **los lapsos
ocasionales aparecen en personas descansadas.** Lo que se asocia al riesgo es
el patrón —muchos lapsos, sostenidos, y en los horarios de menor alerta—, no
un evento aislado.

Por eso el resultado del test no dice ni va a decir si la persona puede
manejar. Dice cómo estuvo su tiempo de reacción en ese momento, con su
referencia horaria al lado, y remite al profesional.
