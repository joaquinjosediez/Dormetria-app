# ⛔ NO CORRER — documento anulado (23-sep-2026)

> **Este documento estaba mal fundado y las policies que propone no hacen
> falta. No las corras.**
>
> Lo escribí asumiendo que la RLS de `sleep_diary` comparaba
> `patient_email` contra `auth.jwt() ->> 'email'`. **No es así.** Las
> policies reales son:
>
> ```
> sleep_diary_self    ALL   patient_email IN (SELECT email FROM patients WHERE auth_id = auth.uid())
> sleep_diary_doctor  ALL   patient_email IN (SELECT patient_email FROM doctor_patients ...)
> admin_lee_diario    SELECT  es_admin()
> ```
>
> Comparan contra **`patients.auth_id`**, no contra el correo del token. Y
> el alta de un hijo ya guarda el `auth_id` DEL ADULTO en la fila del niño
> —está explícito en el código, con ese comentario— justamente para que esta
> policy lo cubra. **El diseño es correcto y no necesita excepciones.**
>
> Si el padre no ve el diario del hijo, el problema es del **dato**, no de
> la policy: la fila del hijo tiene `auth_id` NULL o distinto del actual.
> Agregar las policies de abajo taparía el síntoma y abriría permisos que
> no hacen falta.
>
> El diagnóstico correcto y el arreglo están en
> `SQL-hijos-auth-id.md`.

---

<details>
<summary>Texto original, conservado solo como registro del error</summary>

# El diario de un hijo no se puede guardar — RLS

**Síntoma:** al guardar el diario de Jerónimo aparece
`new row violates row-level security policy for table "sleep_diary"`.

**No es un bug de la app.** El insert que manda el cliente es correcto: escribe
`patient_email` con el email del hijo, que es lo que corresponde. Lo que falta
es del lado de la base.

## Por qué pasa

La RLS de `sleep_diary` compara `patient_email` contra el email del login:

```sql
lower(patient_email) = lower(auth.jwt() ->> 'email')
```

Cuando el padre carga el diario de un hijo, `patient_email` es el email del
hijo y el login sigue siendo el del padre. No coinciden, y el insert se
rechaza.

En `patients` esto ya está resuelto desde hace tiempo — es la policy
`"parents read their children"`, que es la que hace que los perfiles de los
hijos se puedan leer. **Esa misma excepción nunca se agregó en `sleep_diary`.**
Por eso el perfil del hijo abre bien y el diario no guarda.

## Antes de tocar nada — confirmar el diagnóstico

```sql
-- 1. ¿Qué policies tiene hoy sleep_diary?
select policyname, cmd, permissive, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'sleep_diary'
order by cmd, policyname;

-- 2. ¿El hijo está bien vinculado al padre?
select email, name, parent_email
from public.patients
where lower(parent_email) = lower('diezjoaquinjose@gmail.com');
```

Lo que tiene que verse en la consulta 2: una fila por hijo, con `parent_email`
igual al email con el que iniciás sesión. Si `parent_email` está vacío o tiene
otro email, el problema es de datos y las policies de abajo tampoco van a
alcanzar.

## El arreglo

Cuatro policies **permisivas** y nuevas. No modifican ni reemplazan ninguna de
las que ya existen: se suman. Las restrictivas de demo
(`demo_diario_no_se_toca`, `demo_diario_no_se_borra`,
`demo_diario_no_se_agrega`) siguen aplicando igual, porque una restrictiva se
evalúa con AND contra todo lo demás.

```sql
-- Un padre puede manejar el diario de los hijos vinculados a él, y solo de
-- ellos. La pertenencia se prueba contra patients.parent_email, que es la
-- misma condición que ya usa "parents read their children".

drop policy if exists sd_padre_lee_hijo on public.sleep_diary;
create policy sd_padre_lee_hijo on public.sleep_diary
  for select to authenticated
  using (exists (
    select 1 from public.patients p
    where lower(p.email) = lower(sleep_diary.patient_email)
      and lower(p.parent_email) = lower(auth.jwt() ->> 'email')
  ));

drop policy if exists sd_padre_agrega_hijo on public.sleep_diary;
create policy sd_padre_agrega_hijo on public.sleep_diary
  for insert to authenticated
  with check (exists (
    select 1 from public.patients p
    where lower(p.email) = lower(sleep_diary.patient_email)
      and lower(p.parent_email) = lower(auth.jwt() ->> 'email')
  ));

drop policy if exists sd_padre_edita_hijo on public.sleep_diary;
create policy sd_padre_edita_hijo on public.sleep_diary
  for update to authenticated
  using (exists (
    select 1 from public.patients p
    where lower(p.email) = lower(sleep_diary.patient_email)
      and lower(p.parent_email) = lower(auth.jwt() ->> 'email')
  ))
  with check (exists (
    select 1 from public.patients p
    where lower(p.email) = lower(sleep_diary.patient_email)
      and lower(p.parent_email) = lower(auth.jwt() ->> 'email')
  ));

drop policy if exists sd_padre_borra_hijo on public.sleep_diary;
create policy sd_padre_borra_hijo on public.sleep_diary
  for delete to authenticated
  using (exists (
    select 1 from public.patients p
    where lower(p.email) = lower(sleep_diary.patient_email)
      and lower(p.parent_email) = lower(auth.jwt() ->> 'email')
  ));
```

## Después de correrlo

1. Guardá una noche de Jerónimo desde la app. Tiene que decir
   "Registro guardado ✓".
2. Verificá que no se abrió de más:

```sql
-- Tiene que devolver 0 filas. Si devuelve algo, alguna policy quedó
-- demasiado ancha y hay que revisarla antes de seguir.
select d.patient_email
from public.sleep_diary d
where not exists (
  select 1 from public.patients p
  where lower(p.email) = lower(d.patient_email)
)
limit 20;
```

## Lo que hay que revisar aparte

Si `sleep_diary` tenía este agujero, es probable que `evaluations`,
`pvt_tests` y cualquier otra tabla que el padre escriba en nombre del hijo
tengan el mismo. **No lo arreglé a ciegas**: hace falta ver las policies reales
de cada una antes de tocarlas. La consulta:

```sql
select tablename, policyname, cmd, permissive, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('evaluations','pvt_tests','sleep_diary','patients')
order by tablename, cmd;
```

Pegame la salida y te digo cuáles faltan.


</details>
