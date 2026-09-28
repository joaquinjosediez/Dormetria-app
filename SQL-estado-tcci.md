# El profesional ve el avance del programa

Una sola columna. El progreso del programa autogestionado vive en el
localStorage del paciente; esto sube un **resumen** para que el profesional
pueda verlo en el Resumen de la ficha.

```sql
alter table public.patients
  add column if not exists tcci_estado jsonb;

comment on column public.patients.tcci_estado is
  'Resumen del avance en el programa TCC-I, sincronizado por el paciente desde su dispositivo: inicio, semanas_cerradas, ultima_cerrada, tareas_hechas, tareas_total, pct, modo, actualizado. NO contiene respuestas de encuestas ni comentarios: eso es del paciente y de la investigacion, no del seguimiento clinico.';
```

No hace falta tocar la RLS: es la misma fila de `patients` por la que el
profesional ya lee `tags`, `dob` y todo lo demás.

## Verificar

```sql
select email, tcci_estado->>'inicio' as arranco,
       tcci_estado->>'ultima_cerrada' as semanas_cerradas,
       tcci_estado->>'pct' as pct,
       tcci_estado->>'actualizado' as ultima_senal
from public.patients
where tcci_estado is not null
order by (tcci_estado->>'actualizado') desc;
```

## Mientras tanto

Sin la columna, el `patch` falla en silencio y la tarjeta simplemente no
aparece. El programa del paciente no depende de que el profesional lo vea.
