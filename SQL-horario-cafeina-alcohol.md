# La hora de la última cafeína y del último alcohol

## Por qué

El diario guardaba **cuánta** cafeína (`coffee_cups`, en mg) y **cuánto**
alcohol (`alcohol_drinks`, en UA), pero no **cuándo**. Y el análisis de
factores comparaba "con cafeína" contra "sin cafeína".

Eso mete en el mismo grupo al paciente que toma un café a las 8 de la mañana
y al que lo toma a las 21. La vida media de la cafeína es de 5 a 6 horas: a
las 8 no queda nada a la hora de dormir; a las 21 queda más de la mitad.
Promediados, el efecto real se diluye hasta desaparecer, y el gráfico informa
"sin diferencia" sobre algo que sí la tiene.

Se guarda la hora de la **última** dosis, no la de cada bebida. Lo que define
si todavía está activa al acostarse es la última; pedir una hora por bebida
suma un toque por bebida en un formulario que se llena todos los días, y la
adherencia al diario es lo que sostiene todo lo demás.

## El SQL

Dos columnas nullables. **No toca ninguna policy**: agregar una columna no
modifica la RLS de la tabla, que sigue siendo la misma para todas.

```sql
-- ════════════════════════════════════════════════════════════════════
-- Dormetria · hora de la última cafeína y del último alcohol
-- Idempotente.
-- ════════════════════════════════════════════════════════════════════

alter table public.sleep_diary
  add column if not exists last_caffeine_time time,
  add column if not exists last_alcohol_time  time;

comment on column public.sleep_diary.last_caffeine_time is
  'Hora de la ULTIMA dosis de cafeina del dia. Se compara contra bedtime '
  'para calcular cuantas horas antes de acostarse fue. Vida media 5-6 h.';
comment on column public.sleep_diary.last_alcohol_time is
  'Hora de la ULTIMA bebida alcoholica. Se compara contra bedtime. '
  'Metabolismo aproximado 1 UA por hora.';

notify pgrst, 'reload schema';
```

Para verificar:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema='public' and table_name='sleep_diary'
  and column_name in ('last_caffeine_time','last_alcohol_time');
```

Tienen que salir **2 filas**, las dos `time without time zone` y `YES` en
nullable.

## Qué pasa si no se corre

Nada se rompe. El guardado del diario es resiliente: si PostgREST responde
que la columna no existe, la saca del payload y reintenta (ver
`saveDiary`, el bucle de `maxRetries`). La noche se guarda igual, sin la
hora, y los dos factores nuevos simplemente no aparecen porque no tienen
datos.

## Lo que NO se puede hacer

**No hay forma de completar esto para atrás.** Las noches ya cargadas no
tienen la hora y no se puede inferir. Los dos factores nuevos van a empezar
a decir algo recién cuando haya unas 10 noches con el dato, y van a convivir
un tiempo con los factores viejos de "con/sin cafeína", que siguen usando
todo el historial.

## Los cortes, y de dónde salen

| factor | corte | referencia |
|---|---|---|
| Cafeína dentro de las 6 h previas | < 360 min | Drake et al., *J Clin Sleep Med* 2013;9(11):1195-200 |
| Alcohol dentro de las 3 h previas | < 180 min | Ebrahim et al., *Alcohol Clin Exp Res* 2013;37(4):539-49 |

**Por qué 6 h y no 4.** Drake dio 400 mg de cafeína a 0, 3 y 6 horas antes de
acostarse y midió por polisomnografía. Las **tres** dosis alteraron el sueño,
incluida la de 6 h — que es la que la mayoría de los pacientes da por
inofensiva. El corte conservador sería incluso más amplio; 6 h es lo que el
trabajo mide directamente.

**Por qué 3 h en alcohol.** Se metaboliza a razón aproximada de una unidad por
hora. Lo que fragmenta la noche no es haber tomado sino tenerlo todavía en
sangre mientras se duerme: acorta la latencia y después rompe la segunda
mitad. Tres horas es el margen práctico para que la mayor parte ya se haya
ido en un consumo moderado.

Los dos factores comparan **temprano contra tarde**, no contra días sin
consumo: lo que se mide es la hora, no el consumo. Los factores de
"con/sin" siguen existiendo aparte.
