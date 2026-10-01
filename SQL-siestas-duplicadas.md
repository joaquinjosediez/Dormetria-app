# Siestas repetidas dentro de un mismo registro

La pantalla del diario se reusa y las filas de siesta viven en el DOM. Al
abrir un registro nuevo, las del anterior seguían ahí: se guardaban dos
veces. Si la arrastrada tenía el mismo horario, en el actograma las dos
barras se superponen y se ve una sola — de ahí "1,9 siestas por día" con un
actograma que muestra una.

Desde mod235 la app limpia al abrir y deduplica al leer, así que **el
número ya sale bien sin tocar la base**. Esto limpia el dato guardado, que
igual conviene: cualquier export o consulta directa lo sigue viendo mal.

## 1 · Ver el alcance

```sql
-- Registros cuyo JSON de siestas tiene entradas repetidas (mismo start).
select patient_email, diary_date,
       substring(notes from 'Siestas: (\[.*?\])') as siestas
from public.sleep_diary
where notes like '%Siestas: [%'
  and (
    select count(*) <> count(distinct (s->>'start'))
    from jsonb_array_elements(
      (substring(notes from 'Siestas: (\[.*?\])'))::jsonb
    ) as s
  )
order by patient_email, diary_date;
```

> Si alguna fila tiene el JSON mal formado, la consulta falla entera. En ese
> caso corré primero esto para encontrarla y mirala a mano:
>
> ```sql
> select id, patient_email, diary_date,
>        substring(notes from 'Siestas: (\[.*?\])') as siestas
> from public.sleep_diary
> where notes like '%Siestas: [%'
>   and (substring(notes from 'Siestas: (\[.*?\])')) !~ '^\[.*\]$';
> ```

## 2 · Deduplicar

Conserva la **primera** aparición de cada horario de inicio y reescribe el
bloque dentro de `notes`, sin tocar el resto del texto.

```sql
with dup as (
  select id,
         substring(notes from 'Siestas: (\[.*?\])') as crudo
  from public.sleep_diary
  where notes like '%Siestas: [%'
),
limpio as (
  select d.id,
         d.crudo,
         (
           select jsonb_agg(s.valor order by s.orden)
           from (
             select distinct on (e.v->>'start')
                    e.v as valor, e.i as orden
             from dup d2,
                  lateral jsonb_array_elements(d2.crudo::jsonb) with ordinality as e(v, i)
             where d2.id = d.id
             order by e.v->>'start', e.i
           ) s
         )::text as nuevo
  from dup d
  where jsonb_array_length(d.crudo::jsonb) >
        (select count(distinct e.v->>'start')
         from jsonb_array_elements(d.crudo::jsonb) as e(v))
)
update public.sleep_diary sd
set notes = replace(sd.notes, 'Siestas: '||l.crudo, 'Siestas: '||l.nuevo)
from limpio l
where sd.id = l.id;
```

## 3 · Verificar

```sql
select count(*) as registros_con_siestas_repetidas
from public.sleep_diary
where notes like '%Siestas: [%'
  and (
    select count(*) <> count(distinct (s->>'start'))
    from jsonb_array_elements(
      (substring(notes from 'Siestas: (\[.*?\])'))::jsonb
    ) as s
  );
```

Tiene que dar **0**.
