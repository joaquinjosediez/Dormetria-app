# Códigos para los pacientes demo que ya existen

## Primero: tenías razón, y me equivoqué

Existen **13 pacientes demo** cargados, en el dominio `@demo.dormetria.com`,
vinculados a la cuenta `demo@dormetria.com`. Y son bastante mejores que los
cinco que te armé: traen país, talla, peso, medicación, tabaco, alcohol,
actividad física, ocupación, antecedentes y teléfono. Los míos tenían la mitad
de eso.

**Por qué no podés mandarles el código:** el insert que los creó nunca escribió
la columna `code`.

```sql
insert into public.patients (email,name,lname,dob,sex,country,height_cm,
       weight_kg,pathologies,medications,alcohol,tobacco,physical_activity,
       activity_type,medical_history,phone)
```

Ahí no está `code`. No es que el código esté mal o vencido: nunca existió. Por
eso `find_patient_by_code` no los encuentra.

**Debí haber buscado esto antes de crear cinco nuevos.** Lo correcto era
asignarles código a los que ya estaban.

---

## Los 13 y sus códigos

Elegí códigos que se puedan dictar por teléfono sin deletrear.

| Código | Paciente | Edad | Cuadro |
|---|---|---|---|
| **KAFKA1** | Franz Kafka | 35 | Insomnio · ansiedad |
| **CURIE1** | Marie Curie | 52 | SAHOS + insomnio · clonazepam irregular |
| **PETER1** | Peter Pan | 17 | Cronodisrupción · estudiante |
| **KAHLO1** | Frida Kahlo | 47 | Piernas inquietas · ferritina 18 · dolor crónico |
| **WINKLE** | Rip Van Winkle | 30 | Narcolepsia · modafinilo |
| QUIJAN | Alonso Quijano | 58 | SAHOS · hipertensión · exfumador |
| WOOLF1 | Virginia Woolf | 64 | Insomnio · depresión · trazodona |
| GRAY01 | Dorian Gray | 27 | Insomnio · ansiedad · actividad alta |
| FRANK1 | Victor Frankenstein | 41 | Insomnio + parasomnia · alcohol frecuente |
| ADA001 | Ada Lovelace | 33 | Insomnio · migraña |
| JUANA1 | Juana de Arco | 25 | Insomnio · estudiante universitaria |
| BRUNO1 | Bruno Buendía | 8 meses | Lactante · reflujo |
| MATIL1 | Matilda Wormwood | 3 años | Preescolar |

**Los cinco en negrita son los que le mandaría a un colega.** Cubren cinco
mecanismos distintos —insomnio puro, apnea, circadiano, piernas inquietas e
hipersomnia— sin repetir ninguno. Es lo máximo que se aprende con cinco
fichas.

Los dos pediátricos (BRUNO1 y MATIL1) los dejaría para una segunda tanda: el
diario infantil es otra pantalla y mezclarlo con los adultos es justo lo que
querías evitar.

---

## El SQL

```sql
-- ═══════════════════════════════════════════════════════════════════
--  Dormetria · códigos para los pacientes demo que ya existen
--
--  Se puede correr las veces que quieras. No crea ni borra a nadie:
--  sólo escribe la columna `code` que había quedado vacía.
-- ═══════════════════════════════════════════════════════════════════

update public.patients set code = 'KAFKA1' where email = 'franz.kafka@demo.dormetria.com';
update public.patients set code = 'CURIE1' where email = 'marie.curie@demo.dormetria.com';
update public.patients set code = 'PETER1' where email = 'peter.pan@demo.dormetria.com';
update public.patients set code = 'KAHLO1' where email = 'frida.kahlo@demo.dormetria.com';
update public.patients set code = 'WINKLE' where email = 'rip.vanwinkle@demo.dormetria.com';
update public.patients set code = 'QUIJAN' where email = 'alonso.quijano@demo.dormetria.com';
update public.patients set code = 'WOOLF1' where email = 'virginia.woolf@demo.dormetria.com';
update public.patients set code = 'GRAY01' where email = 'dorian.gray@demo.dormetria.com';
update public.patients set code = 'FRANK1' where email = 'victor.frankenstein@demo.dormetria.com';
update public.patients set code = 'ADA001' where email = 'ada.lovelace@demo.dormetria.com';
update public.patients set code = 'JUANA1' where email = 'juana.dearco@demo.dormetria.com';
update public.patients set code = 'BRUNO1' where email = 'bruno.buendia@demo.dormetria.com';
update public.patients set code = 'MATIL1' where email = 'matilda.wormwood@demo.dormetria.com';

-- Y que queden marcados como demo, para que el panel admin los agrupe
-- y para que no ensucien ningún análisis.
alter table public.patients add column if not exists is_demo boolean default false;
update public.patients set is_demo = true where email like '%@demo.dormetria.com';

notify pgrst, 'reload schema';
```

### Comprobar que quedó

```sql
select code,
       name || ' ' || lname                      as paciente,
       coalesce(activity_type,'—')               as ocupacion,
       (select count(*) from sleep_diary d
        where lower(d.patient_email) = lower(p.email)) as noches
from   patients p
where  email like '%@demo.dormetria.com'
order  by code;
```

Si alguno aparece con **0 noches**, ese no sirve para mostrar: la app se va a
ver vacía. Decime cuáles y les genero el diario.

---

## Un error mío que hay que corregir igual

La vista `research_cohort` que te pasé filtraba así:

```sql
and p.email not like '%@dormetria.com'
```

**Ese patrón no agarra a estos pacientes.** `marie.curie@demo.dormetria.com`
termina en `.dormetria.com`, no en `@dormetria.com`, y `LIKE` compara carácter
por carácter: el punto no es un arroba. Lo verifiqué, no lo deduje.

Hoy no te afecta —ninguno tiene `consent_version`, así que igual quedan
afuera— pero es una mina enterrada: el día que alguien les complete el
consentimiento, entran. El patrón correcto es sin arroba:

```sql
create or replace view research_cohort as
select
  encode(digest(lower(p.email) || 'dormetria-research-v1', 'sha256'), 'hex') as subject_id,
  p.sex,
  case when nullif(trim(p.dob),'') ~ '^\d{4}-\d{2}-\d{2}$'
       then date_part('year', age(p.dob::date))::int end as edad,
  p.consent_version, p.consent_date, p.consent_origen
from   patients p
where  p.parent_email is null
  and  coalesce(p.is_demo, false) = false
  and  p.email not like '%dormetria.com'     -- <<< sin arroba: agarra los dos dominios
  and  p.consent_version  is not null
  and  p.research_consent is true
  and  p.research_withdrawn_date is null;

notify pgrst, 'reload schema';
```

---

## Y si ya corriste el SQL de mis cinco

No hacen falta. Para sacarlos:

```sql
delete from sleep_diary     where patient_email like '%.demo@dormetria.com';
delete from evaluations     where patient_email like '%.demo@dormetria.com';
delete from doctor_patients where patient_email like '%.demo@dormetria.com';
delete from patients        where email         like '%.demo@dormetria.com';
```

Ese patrón (`%.demo@dormetria.com`) **sólo** alcanza a los míos —
`marta.demo@`, `roberto.demo@`— y no toca a los de
`@demo.dormetria.com`. Lo comprobé antes de escribirlo, justamente porque
los dos dominios se parecen lo suficiente como para borrar lo que no es.

Si todavía no lo corriste, no lo corras.

---

## Lo que no puedo verificar

No tengo acceso a tu base. Todo esto sale de leer los archivos que te fui
dejando en sesiones anteriores, así que puede haber diferencias con lo que
realmente quedó cargado. La consulta de comprobación de arriba es la que te lo
dice de verdad — correla y mandame el resultado si algo no cuadra.
