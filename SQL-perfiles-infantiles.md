# Perfiles infantiles · escolaridad y ocultar sin borrar

## Por qué `hidden_at` y no un DELETE

El botón "Eliminar" de un perfil infantil hacía `db.del` sobre `sleep_diary`,
`evaluations`, `cbti_progress` y `patients`. O sea que **un padre podía
destruir, desde su teléfono y con un confirm, la historia clínica completa de
su hijo** — incluida la que estaba usando un profesional para seguirlo, y sin
que ese profesional se enterara.

La **Ley 26.529** obliga a conservar la historia clínica. Un botón así no
puede existir del lado del paciente. Ahora el perfil se **oculta**: desaparece
de la app del adulto, que es lo que él quiere, y los datos siguen ahí.

Borrar de verdad se hace a mano, a pedido del titular, y queda registrado.

```sql
-- ════════════════════════════════════════════════════════════════════
-- Dormetria · mod214 — perfiles infantiles
-- Idempotente.
-- ════════════════════════════════════════════════════════════════════

-- 1 · Ocultar sin borrar.
alter table public.patients
  add column if not exists hidden_at timestamptz;

comment on column public.patients.hidden_at is
  'Cuando el adulto a cargo quita el perfil de su app. NO borra nada: la ficha y sus registros siguen existiendo y el profesional vinculado los sigue viendo. Borrar de verdad es una operacion manual, a pedido del titular.';

-- 2 · Rutina escolar.
alter table public.patients
  add column if not exists schooled boolean;

comment on column public.patients.schooled is
  'Si el perfil tiene rutina escolar (jardin, escuela, guarderia con horario fijo). Sin rutina, "dia laborable" y "dia libre" son el mismo grupo: la deuda de sueño y el jet lag social no se calculan porque compararian una cosa consigo misma.';

create index if not exists patients_parent_visible_idx
  on public.patients (parent_email) where hidden_at is null;
```

## Rellenar la escolaridad de los que ya existen

No se puede adivinar caso por caso, pero sí poner el default razonable y
dejar que lo corrijas: en Argentina la sala de 5 es obligatoria.

**Primero mirá:**

```sql
-- dob esta guardada como TEXT, no como date: por eso "now() - dob" da
-- 42883 operator does not exist. Se castea.
select email, name, dob,
       floor(extract(epoch from (now() - dob::date))/31557600) as edad,
       schooled
from public.patients
where parent_email is not null
order by dob desc;
```

**Después, si el default te sirve:**

```sql
update public.patients
set schooled = (floor(extract(epoch from (now() - dob::date))/31557600) >= 5)
where parent_email is not null
  and schooled is null
  and dob is not null
  and dob <> '';
```

Los que queden mal los corregís desde el perfil del chico.

## Verificación

```sql
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='patients'
  and column_name in ('hidden_at','schooled')
order by column_name;
```
