# Noches duplicadas en el diario

En el actograma de Belén Montaña aparecían barras dobles: la misma noche
cargada dos veces. **No es un problema de dibujo.** El análisis promedia las
dos filas como si fueran dos noches distintas, así que una noche mala
cargada dos veces pesa el doble en la eficiencia, la latencia y todo lo que
sale de ahí.

Nada lo impedía: ni la base ni la app. Desde mod230 la app actualiza en vez
de duplicar; esto limpia lo que ya quedó y hace imposible que vuelva.

## 1 · Ver el alcance

```sql
select patient_email, diary_date, count(*) as filas,
       min(created_at) as primera, max(created_at) as ultima
from public.sleep_diary
group by patient_email, diary_date
having count(*) > 1
order by count(*) desc, patient_email, diary_date;
```

Y el resumen por paciente, para saber a quién le distorsionó el análisis:

```sql
select patient_email,
       count(*)                              as noches_duplicadas,
       sum(filas - 1)                        as filas_de_mas
from (
  select patient_email, diary_date, count(*) as filas
  from public.sleep_diary
  group by patient_email, diary_date
  having count(*) > 1
) d
group by patient_email
order by filas_de_mas desc;
```

## 2 · Mirar antes de borrar

Conviene ver si las copias son idénticas o distintas. **Si son distintas, la
persona corrigió su noche y la buena es la última**; si son idénticas, fue un
doble guardado.

```sql
select patient_email, diary_date, id, created_at,
       bedtime, wake_time, sleep_minutes, sleep_quality
from public.sleep_diary
where (patient_email, diary_date) in (
  select patient_email, diary_date
  from public.sleep_diary
  group by patient_email, diary_date
  having count(*) > 1
)
order by patient_email, diary_date, created_at;
```

## 3 · Dejar una sola, la más reciente

> **Corré primero la consulta 1 y guardate el resultado.** Esto borra filas
> de pacientes reales y no hay vuelta atrás.

```sql
-- Se conserva la de created_at mas nuevo (y ante empate, el id mas alto):
-- si la persona volvio a cargar la misma noche, lo ultimo que escribio es
-- lo que quiso dejar.
with ranked as (
  select id,
         row_number() over (
           partition by lower(patient_email), diary_date
           order by created_at desc nulls last, id desc
         ) as n
  from public.sleep_diary
)
delete from public.sleep_diary
where id in (select id from ranked where n > 1);
```

## 4 · Que no pueda volver a pasar

```sql
-- Despues del paso 3, no antes: con duplicados presentes este indice falla.
create unique index if not exists sleep_diary_una_noche_por_paciente
  on public.sleep_diary (lower(patient_email), diary_date);
```

A partir de acá, un segundo INSERT para la misma noche devuelve **409
conflict** en vez de crear una fila. La app ya no llega a ese caso —chequea
antes y actualiza— pero el índice es la garantía que no depende de que el
código esté bien.

## 5 · Verificar

```sql
select count(*) as grupos_duplicados from (
  select 1 from public.sleep_diary
  group by lower(patient_email), diary_date
  having count(*) > 1
) x;
```

Tiene que dar **0**.
