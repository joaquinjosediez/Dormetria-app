# Link de turnos del profesional

## Por qué

Una solicitud de consulta queda esperando a que el profesional entre a
Dormetria. Si ya tiene un sistema de turnos propio, el paciente puede ir ahí
directo y sacar el turno en el momento.

**Hasta que corras esto, el directorio funciona igual**: el código pide
`booking_url` con un select optimista y, si la columna no existe, cae al
select básico. Sin ese cuidado el `400` de PostgREST dejaba el directorio
**vacío**, no incompleto.

```sql
-- ════════════════════════════════════════════════════════════════════
-- Dormetria · mod216 — link de turnos
-- Idempotente.
-- ════════════════════════════════════════════════════════════════════

alter table public.doctors
  add column if not exists booking_url text;

comment on column public.doctors.booking_url is
  'Link al sistema de turnos propio del profesional (Doctoralia, Calendly, el que use). Si esta cargado, el directorio ofrece "Pedir turno online" en vez de dejar una solicitud esperando.';
```

## Verificar que las solicitudes se puedan leer

Las solicitudes viven en `consultation_requests` desde hace tiempo, pero el
profesional no tenía **ninguna pantalla** donde verlas: `loadConsultRequests()`
pintaba en un elemento `doctor-list` que no existe en el DOM, así que la
función volvía en silencio. Ahora aparecen en **Notificaciones**.

Antes de darlo por bueno, confirmá que la RLS deje leerlas:

```sql
select policyname, cmd, qual
from pg_policies
where schemaname='public' and tablename='consultation_requests'
order by cmd;
```

Tiene que haber un `SELECT` que permita al profesional ver las filas donde
`doctor_email` es el suyo, y un `UPDATE` para poder marcarlas como
respondidas. Si no están, pasame la salida y las escribo — **no las invento
sin ver lo que hay**, que es el error que cometí con el diario de los hijos.

Y esta, que dice si hay algo esperando:

```sql
select doctor_email, status, count(*), max(created_at) as ultima
from public.consultation_requests
group by 1,2
order by 4 desc;
```
