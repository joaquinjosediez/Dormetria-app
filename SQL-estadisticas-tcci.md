# Estadísticas del programa TCC-I, para el panel de administrador

Mismo criterio que el resto del panel: **las cuentas se hacen adentro de la
base y salen números, no filas**. Ninguna de estas funciones devuelve un
email de paciente, una noche, una respuesta escrita ni un comentario.

Dependen de `es_admin()` (bloque 7 del SQL general) y de la columna
`patients.tcci_estado`.

```sql
-- ════════════════════════════════════════════════════════════════════
-- Dormetria · mod225 — estadisticas agregadas del programa TCC-I
-- Idempotente. Todo security definer + guarda es_admin().
-- ════════════════════════════════════════════════════════════════════

-- ── 1 · El embudo: quien arranco, por donde va, quien termino ────────
create or replace function public.admin_stats_tcci()
returns table (
  arrancaron        bigint,
  solos             bigint,
  acompanados       bigint,
  terminaron        bigint,
  en_curso          bigint,
  abandonados       bigint,   -- sin señal hace 14 dias o mas, sin terminar
  dias_prom_completo numeric, -- inicio → ultima señal, solo de los que terminaron
  dias_med_completo  numeric
)
language sql stable security definer
set search_path = public
as $$
  with base as (
    select
      p.email,
      (p.tcci_estado->>'inicio')::timestamptz            as inicio,
      (p.tcci_estado->>'actualizado')::timestamptz       as ultima,
      coalesce((p.tcci_estado->>'ultima_cerrada')::int,0) as cerradas,
      coalesce((p.tcci_estado->>'total_semanas')::int,7)  as total,
      coalesce(p.tcci_estado->>'modo','auto')             as modo
    from public.patients p
    where p.tcci_estado is not null
      and p.tcci_estado->>'inicio' is not null
      and coalesce(p.is_demo,false) = false
      and lower(p.email) not like '%@demo.dormetria.com'
  ),
  clasif as (
    select *,
      (cerradas >= total)                                          as completo,
      (cerradas < total and ultima < now() - interval '14 days')    as frenado
    from base
  )
  select
    count(*),
    count(*) filter (where modo <> 'guiado'),
    count(*) filter (where modo =  'guiado'),
    count(*) filter (where completo),
    count(*) filter (where not completo and not frenado),
    count(*) filter (where frenado),
    round(avg(extract(epoch from (ultima - inicio))/86400)
          filter (where completo)::numeric, 1),
    round((percentile_cont(0.5) within group (
             order by extract(epoch from (ultima - inicio))/86400)
           filter (where completo))::numeric, 1)
  from clasif
  where public.es_admin();
$$;

-- ── 2 · Donde se quedaron ────────────────────────────────────────────
-- Una fila por semana: cuantos la tienen como ULTIMA cerrada. La semana
-- con mas gente parada es donde el programa expulsa.
create or replace function public.admin_stats_tcci_abandono()
returns table (
  ultima_cerrada int,
  personas       bigint,
  frenados       bigint,
  dias_quietos_prom numeric
)
language sql stable security definer
set search_path = public
as $$
  with base as (
    select
      coalesce((p.tcci_estado->>'ultima_cerrada')::int,0) as cerradas,
      coalesce((p.tcci_estado->>'total_semanas')::int,7)  as total,
      (p.tcci_estado->>'actualizado')::timestamptz        as ultima
    from public.patients p
    where p.tcci_estado is not null
      and p.tcci_estado->>'inicio' is not null
      and coalesce(p.is_demo,false) = false
      and lower(p.email) not like '%@demo.dormetria.com'
  )
  select cerradas,
         count(*),
         count(*) filter (where cerradas < total
                            and ultima < now() - interval '14 days'),
         round(avg(extract(epoch from (now() - ultima))/86400)::numeric, 0)
  from base
  where public.es_admin()
  group by cerradas
  order by cerradas;
$$;

-- ── 3 · Utilidad contra costo, semana por semana ─────────────────────
-- La columna que importa es "saldo". Una semana con 8 de utilidad y 9 de
-- costo no es una semana buena: es la que hace que abandonen despues.
create or replace function public.admin_stats_tcci_encuestas()
returns table (
  semana      int,
  respuestas  bigint,
  utilidad    numeric,
  costo       numeric,
  saldo       numeric,
  compromiso  numeric
)
language sql stable security definer
set search_path = public
as $$
  with cierre as (
    select semana,
           count(*)                                        as n,
           avg((respuestas->>'sirvio')::numeric)           as util,
           avg((respuestas->>'costo')::numeric)            as cost
    from public.tcci_encuestas
    where tipo = 'cierre-semana' and semana is not null
    group by semana
  ),
  comp as (
    select semana, avg((respuestas->>'compromiso')::numeric) as c
    from public.tcci_encuestas
    where tipo = 'compromiso' and semana is not null
    group by semana
  )
  select coalesce(cierre.semana, comp.semana),
         coalesce(cierre.n, 0),
         round(cierre.util, 1),
         round(cierre.cost, 1),
         round(cierre.util - cierre.cost, 1),
         round(comp.c, 1)
  from cierre
  full outer join comp on comp.semana = cierre.semana
  where public.es_admin()
  order by 1;
$$;

-- ── 4 · Cuanto pagarian ──────────────────────────────────────────────
create or replace function public.admin_stats_tcci_precio()
returns table ( tramo text, personas bigint )
language sql stable security definer
set search_path = public
as $$
  select coalesce(respuestas->>'precio', 'sin_respuesta'), count(*)
  from public.tcci_encuestas
  where tipo = 'precio' and public.es_admin()
  group by 1
  order by 2 desc;
$$;

-- Permisos: solo usuarios autenticados pueden ejecutarlas, y adentro
-- cada una vuelve a chequear es_admin(). Doble puerta a proposito.
revoke all on function public.admin_stats_tcci()            from public;
revoke all on function public.admin_stats_tcci_abandono()   from public;
revoke all on function public.admin_stats_tcci_encuestas()  from public;
revoke all on function public.admin_stats_tcci_precio()     from public;
grant execute on function public.admin_stats_tcci()           to authenticated;
grant execute on function public.admin_stats_tcci_abandono()  to authenticated;
grant execute on function public.admin_stats_tcci_encuestas() to authenticated;
grant execute on function public.admin_stats_tcci_precio()    to authenticated;

notify pgrst, 'reload schema';
```

## Probar

```sql
select * from public.admin_stats_tcci();
select * from public.admin_stats_tcci_abandono();
select * from public.admin_stats_tcci_encuestas();
select * from public.admin_stats_tcci_precio();
```

Si no sos admin, las cuatro devuelven vacío. Eso es lo correcto, no un error.

## Límite honesto del dato

`dias_prom_completo` mide **inicio → última señal**, no inicio → fin real.
Si alguien terminó la semana 7 y siguió abriendo la app, el número se
estira. Para el tamaño de muestra de la beta alcanza; cuando haya volumen,
conviene guardar la fecha de cierre de cada semana en vez de solo la última.
