# Revocar un profesional, y los PVT que no aparecen

Dos reportes del mismo día:

> no me deja revocar profesionales desde el usuario paciente

> un paciente me dijo que no le está guardando los test de alerta

Los dos tienen la misma forma: **la app decía que había funcionado sin
comprobar que hubiera pasado algo**. mod287 arregla la parte de la app —
ahora verifica y, si no pasó, lo dice. Este archivo es la otra mitad: el
permiso que falta del lado de la base.

> Correr el **paso 1** primero y mirar la salida. Es solo lectura. Lo que
> haya que crear sale de ahí, no de una suposición mía: no tengo acceso a
> la base y las policies de estas dos tablas no están en el repositorio.

---

## 1 · Qué permisos hay hoy (solo lectura, no cambia nada)

```sql
select tablename,
       policyname,
       cmd,
       permissive,
       roles,
       qual        as using_expr,
       with_check  as check_expr
  from pg_policies
 where schemaname = 'public'
   and tablename in ('doctor_patients', 'pvt_tests')
 order by tablename, cmd, policyname;
```

Y si RLS está activo en las dos:

```sql
select relname, relrowsecurity, relforcerowsecurity
  from pg_class
 where relname in ('doctor_patients','pvt_tests');
```

---

## 2 · Revocar: falta una policy de DELETE para el paciente

**Qué pasaba.** `unlinkDoctor` mandaba el `DELETE` con `fetch` y no miraba
la respuesta. Pero aunque la mirara, no alcanzaría: **con RLS, un DELETE
que no matchea ninguna fila devuelve 204**. Es un éxito que no borró nada.
Por eso el toast decía "Profesional desvinculado" y el profesional seguía
viendo todo.

**Por qué importa más que un botón que no anda.** Revocar el acceso es el
ejercicio del derecho del titular a retirar el consentimiento — art. 6 y
art. 11 de la Ley 25.326, y el art. 2 inc. e) de la Ley 26.529 sobre
autonomía de la voluntad. Que el botón exista y no haga nada es peor que
no tenerlo: la persona cree que revocó y no revocó.

**Si el paso 1 no muestra ninguna policy de `delete` (ni `all`) para el
paciente**, esta es la que falta:

```sql
-- Un paciente puede borrar SUS vínculos. Nada más: la condición compara
-- patient_email contra el correo del token, así que no alcanza filas de
-- otra persona.
--
-- PERMISSIVE y nueva: las permisivas se combinan con OR, así que esto
-- agrega un permiso y no le saca nada a las que ya están.
create policy dp_paciente_revoca
  on public.doctor_patients
  for delete
  to authenticated
  using ( lower(patient_email) = lower(auth.jwt() ->> 'email') );
```

**Verificación — entrando como el paciente, no como service_role:**

```sql
-- Debe devolver 1 fila ANTES y 0 DESPUÉS de tocar "Desvincular" en la app.
select doctor_email
  from public.doctor_patients
 where lower(patient_email) = lower(auth.jwt() ->> 'email');
```

Si sigue devolviendo la fila después de borrar, la policy no se aplicó o
hay otra RESTRICTIVE que la bloquea — las restrictivas se combinan con AND
y una sola alcanza para impedirlo.

---

## 2 bis · Antes de culpar a la RLS: cómo están guardados los correos

Segunda vuelta del mismo reporte, y apareció algo que no era un permiso.

La lista de profesionales del paciente se arma con `patient_email=ilike.` y
el borrado usaba `patient_email=eq.`. **En Postgres `eq` distingue
mayúsculas.** Si el correo quedó guardado con otra capitalización —y se
tipea a mano al vincular— la pantalla lo muestra y el DELETE no lo
encuentra: cero filas, 204, silencio. mod288 usa `ilike` en los dos lados y
cuenta antes y después, así que la app ahora distingue los dos casos sola.
Pero conviene mirar si hay correos desparejos, porque afectan a más cosas
que a este botón:

```sql
-- Filas donde el correo no está en minúsculas. Si aparece alguna, cualquier
-- consulta con `eq.` sobre esta tabla se la saltea.
select patient_email, doctor_email
  from public.doctor_patients
 where patient_email <> lower(patient_email)
    or doctor_email  <> lower(doctor_email);
```

Si hay, normalizarlas es un `update` chico y de bajo riesgo —la RLS ya
compara con `lower()` en todos lados, así que esto la acerca, no la aleja:

```sql
update public.doctor_patients
   set patient_email = lower(patient_email),
       doctor_email  = lower(doctor_email)
 where patient_email <> lower(patient_email)
    or doctor_email  <> lower(doctor_email);
```

> Correr primero el `select`. Si devuelve 0 filas, el problema **no** es
> este y es el permiso del punto 2.

---

## 3 · PVT: el INSERT entra y el SELECT no lo ve

**Qué pasaba.** El `POST` a `pvt_tests` devolvía 201 y la pantalla decía
"Test guardado ✓". En *Registros* no aparecía nada.

Con RLS, **INSERT y SELECT son políticas separadas**. Si la de INSERT es
más amplia que la de SELECT, la fila entra y después el dueño del dato no
la puede leer. Para la persona, el test se perdió. No hay ningún error en
ningún lado: por eso nadie lo vio hasta que un paciente lo dijo.

Es la misma clase de desajuste que ya documentaste en `BUGS.md` para
`patient_education`, al revés.

**Antes de crear nada, confirmar que es esto.** Entrando como el paciente
que reportó:

```sql
-- Como el paciente:
select count(*) from public.pvt_tests
 where lower(patient_email) = lower(auth.jwt() ->> 'email');
```

```sql
-- Como service_role (panel de Supabase, SQL editor sin impersonar):
select patient_email, created_at, mean_rt, lapses
  from public.pvt_tests
 where lower(patient_email) = lower('CORREO-DEL-PACIENTE')
 order by created_at desc
 limit 10;
```

**Si el segundo trae filas y el primero da 0, es exactamente esto** y falta
la policy de lectura:

```sql
create policy pvt_paciente_lee_lo_suyo
  on public.pvt_tests
  for select
  to authenticated
  using ( lower(patient_email) = lower(auth.jwt() ->> 'email') );
```

Si los dos dan 0, el INSERT nunca entró y el problema es otro: en ese caso
mandame lo que imprime la consola al terminar un test, que mod287 ahora
distingue los dos casos y lo dice con todas las letras.

### El profesional también tiene que poder leerlos

El PVT se muestra en la ficha del paciente. Si el profesional no lo ve, es
la misma historia del otro lado. El vínculo se exige contra
`doctor_patients`, igual que en el resto de la app:

```sql
create policy pvt_profesional_vinculado_lee
  on public.pvt_tests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.doctor_patients dp
       where lower(dp.patient_email) = lower(public.pvt_tests.patient_email)
         and lower(dp.doctor_email)  = lower(auth.jwt() ->> 'email')
    )
  );
```

Esto es lo que hace que el punto 2 importe de verdad: **cuando el paciente
revoca, la fila de `doctor_patients` desaparece y el profesional deja de
ver los PVT en el mismo momento**. El permiso cuelga del vínculo, no de una
copia del permiso. Si la lectura del profesional estuviera escrita de otra
forma —una lista aparte, una columna `doctor_email` en `pvt_tests`—,
revocar no revocaría nada y habría que arreglar eso también.

---

## 4 · Después de correrlo

Volver a mirar el paso 1 y comprobar que:

- Las policies nuevas figuran y son `PERMISSIVE`.
- Ninguna policy anterior desapareció ni cambió.
- No hay ninguna `RESTRICTIVE` sobre estas dos tablas que las anule.

Y probar en la app con una cuenta demo, no con una real: desvincular y
confirmar que el profesional deja de ver la ficha.
