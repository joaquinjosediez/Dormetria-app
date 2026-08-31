# Mensaje de WhatsApp para los colegas

## Antes de mandarlo, dos cosas

**1. Los códigos tienen que existir.** Corré el SQL de
`DEMO-codigos-para-los-que-ya-existen.md`. Si mandás el mensaje antes, el
colega pega KAFKA1, no pasa nada, y no lo intenta una segunda vez.

**2. Y el SQL de sólo lectura, corregido.** El que te pasé filtraba por
`%.demo@dormetria.com` y **no alcanza** a estos pacientes, que están en
`@demo.dormetria.com`. Sin esto, el primer colega que cargue una noche se la
deja cargada al segundo.

```sql
-- ═══════════════════════════════════════════════════════════════════
--  Dormetria · que los demo no se puedan modificar
--
--  RESTRICTIVE es la palabra que hace el trabajo: las políticas
--  normales se suman (alcanza que UNA permita), las restrictivas se
--  cruzan (tienen que permitir TODAS). Sin eso, no bloquea nada.
--
--  Vincularse SÍ se puede: es lo que hace el colega con el código.
-- ═══════════════════════════════════════════════════════════════════

alter table public.patients    enable row level security;
alter table public.sleep_diary enable row level security;

drop policy if exists demo_pacientes_no_se_tocan on public.patients;
create policy demo_pacientes_no_se_tocan on public.patients
  as restrictive for update to authenticated
  using (email not like '%dormetria.com');

drop policy if exists demo_pacientes_no_se_borran on public.patients;
create policy demo_pacientes_no_se_borran on public.patients
  as restrictive for delete to authenticated
  using (email not like '%dormetria.com');

drop policy if exists demo_diario_no_se_toca on public.sleep_diary;
create policy demo_diario_no_se_toca on public.sleep_diary
  as restrictive for update to authenticated
  using (patient_email not like '%dormetria.com');

drop policy if exists demo_diario_no_se_borra on public.sleep_diary;
create policy demo_diario_no_se_borra on public.sleep_diary
  as restrictive for delete to authenticated
  using (patient_email not like '%dormetria.com');

drop policy if exists demo_diario_no_se_agrega on public.sleep_diary;
create policy demo_diario_no_se_agrega on public.sleep_diary
  as restrictive for insert to authenticated
  with check (patient_email not like '%dormetria.com');

notify pgrst, 'reload schema';
```

> `%dormetria.com` cubre cualquier cuenta de prueba: los 13 que ya
> tenías, los cinco que armé yo, y los que agregues después.
> **Después de correrlo, probá editar a Kafka desde tu cuenta: tiene que
> fallar.** Si te deja, la política no quedó y el mensaje diría algo falso.

---

## El mensaje

Copiá desde acá. Los asteriscos son negrita de WhatsApp, se ven bien al pegar.

---

Hola *[nombre]*, ¿cómo andás?

Estuve armando *Dormetria*, una app de medicina del sueño: diario, actograma, escalas validadas y un programa de TCC-I de 7 semanas. Me vendría muy bien que la pruebes y me digas qué le falta.

Entrás en *app.dormetria.com* → "Soy profesional de la salud" → Crear cuenta. Dos minutos.

Para que no arranques con la pantalla vacía te dejé 5 pacientes de prueba con 8 semanas de datos cargados. Andá a *Vincular paciente* y pegá estos códigos:

*KAFKA1* — insomnio de conciliación
*CURIE1* — apnea + insomnio
*PETER1* — adolescente con retraso de fase
*KAHLO1* — piernas inquietas
*WINKLE* — hipersomnia

Con uno solo ya te das una idea. Los cinco te muestran el rango completo.

Son de sólo lectura, así que mirá todo lo que quieras sin miedo a romper nada.

Lo que más me sirve que me digas: *qué te resultó confuso* y *qué usarías de verdad en consultorio*.

Gracias!

---

## Versión corta

Si preferís algo que se lea de un vistazo:

---

Hola *[nombre]*! Armé una app de medicina del sueño y me gustaría que la pruebes: *app.dormetria.com* → "Soy profesional de la salud".

Te dejé 5 pacientes de prueba con datos cargados. En *Vincular paciente* pegá: *KAFKA1* (insomnio), *CURIE1* (apnea), *PETER1* (retraso de fase), *KAHLO1* (piernas inquietas), *WINKLE* (hipersomnia).

Contame qué te pareció confuso y qué usarías en consultorio. Gracias!

---

## Un detalle sobre los nombres

Los códigos son fáciles de dictar, pero cuando el colega los cargue va a ver
*Franz Kafka*, *Marie Curie*, *Frida Kahlo*. Algunos son personas reales con
antecedentes médicos inventados.

Entre colegas se lee como lo que es —fichas de ejemplo, con un guiño— y no
tiene mayor problema. Pero si en algún momento la demo pasa a ser pública, a
una web o a un video, ahí conviene cambiarlos por nombres inventados: atribuir
diagnósticos a personas reales identificables es de esas cosas que no molestan
a nadie hasta que molestan. Si querés, te preparo el `update` con nombres de
fantasía que conserve todos los datos clínicos intactos.
