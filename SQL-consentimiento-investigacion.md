# El consentimiento de investigación · versión corregida

Reemplaza al documento anterior. Corrige los dos errores que te dieron y
arregla algo que la primera consulta dejó ver.

---

## Lo que reveló tu consulta

```
situacion       pacientes   con_conformidad_registrada
dijo que no        92                    0
```

**Esos 92 no dijeron que no. Nunca se les preguntó.**

La columna `research_consent` tiene un valor por omisión de `false`, así que
todos nacen en "no" sin haber contestado nada. Y `con_conformidad_registrada = 0`
lo confirma: no hay una sola conformidad registrada en toda la base.

Esto importa más de lo que parece. Si mañana filtrás por `research_consent = false`
pensando que son gente que se negó, te estás perdiendo 92 personas a las que
simplemente nunca se les ofreció. Por eso de acá en adelante **el filtro de la
cohorte no es `research_consent`, es `consent_version`**: esa columna sólo se
escribe cuando alguien contestó de verdad.

```sql
-- Para ver el valor por omisión que tiene hoy la columna
select column_name, column_default, is_nullable
from   information_schema.columns
where  table_schema='public' and table_name='patients'
  and  column_name in ('research_consent','dob');
```

---

## Paso 1 · Las columnas (corregido)

```sql
-- ═══════════════════════════════════════════════════════════════════
--  Dormetria · consentimiento, en la base y no en el navegador
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

alter table public.patients add column if not exists consent_version         text;
alter table public.patients add column if not exists consent_date            timestamptz;
alter table public.patients add column if not exists consent_origen          text;
alter table public.patients add column if not exists research_consent        boolean;
alter table public.patients add column if not exists research_consent_date   timestamptz;
alter table public.patients add column if not exists research_withdrawn_date timestamptz;

-- Sacar el valor por omisión: "false" y "todavía no contestó" NO son lo
-- mismo, y mientras la columna tenga default false no se pueden distinguir.
alter table public.patients alter column research_consent drop default;

notify pgrst, 'reload schema';
```

> **No corras un `update` sobre los 92.** Dejalos como están: mod179 los va a
> ir resolviendo solo a medida que entren. Pisarlos a `null` no aporta nada
> y `consent_version` ya alcanza para saber quién contestó.

---

## Paso 2 · La foto real

```sql
select
  case
    when consent_version is null       then 'todavía no contestó'
    when research_consent is true      then 'aceptó investigación'
    else                                    'contestó que no'
  end                          as situacion,
  count(*)                     as pacientes
from   patients
where  parent_email is null
group  by 1
order  by pacientes desc;
```

Hoy te va a dar los 92 en `todavía no contestó`. En una o dos semanas, a
medida que vayan entrando con mod179, se van a repartir solos.

---

## Paso 3 · La cohorte (corregido)

**El error `function age(text) does not exist`** es porque `dob` está guardada
como texto, no como fecha. No la conviertas —romperías la app—: casteala al
usarla, y con `nullif` para que una fecha mal cargada no tire toda la consulta.

```sql
create or replace view research_cohort as
select
  encode(digest(lower(p.email) || 'dormetria-research-v1', 'sha256'), 'hex') as subject_id,
  p.sex,
  case
    when nullif(trim(p.dob),'') ~ '^\d{4}-\d{2}-\d{2}$'
    then date_part('year', age(p.dob::date))::int
  end                            as edad,
  p.consent_version,
  p.consent_date,
  p.consent_origen
from   patients p
where  p.parent_email is null
  and  p.consent_version    is not null   -- contestó
  and  p.research_consent   is true       -- y dijo que sí
  and  p.research_withdrawn_date is null; -- y no se arrepintió
```

**El error `relation "research_cohort" does not exist`** era consecuencia del
anterior: como la vista no se llegó a crear, la siguiente no encontró de dónde
leer. Corré esta primero y después la de abajo.

```sql
create or replace view research_nights as
select
  c.subject_id, c.sex, c.edad,
  d.diary_date, d.day_type,
  d.tst_min, d.sol_min, d.waso_min, d.se_pct,
  d.quality, d.mood, d.energy
from   sleep_diary d
join   patients p on lower(p.email) = lower(d.patient_email)
join   research_cohort c
       on c.subject_id = encode(digest(lower(p.email) || 'dormetria-research-v1', 'sha256'), 'hex');
```

Si tira error por un nombre de columna, mandámelo: los de `sleep_diary` los
puse de memoria y no los verifiqué contra tu base.

Para comprobar:

```sql
select count(*) as sujetos from research_cohort;
select count(*) as noches, count(distinct subject_id) as sujetos from research_nights;
```

---

## Y para publicar mod179

El comando que te di estaba mal: `publicar.sh` espera **sólo la versión**, no
un mensaje. Por eso buscaba un archivo llamado
`APP-index-mod178 - el consentimiento queda en la base.html`.

```bash
cd ~/Documents/Dormetria-app && ./publicar.sh mod179
```

Bajá antes `APP-index-mod179.html` y `APP-styles-mod179.css` a Descargas.
Ojo que en producción todavía está **mod176**: mod179 se lleva todo lo de
mod177, mod178 y mod179 junto.
