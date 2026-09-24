# El diario del hijo no se ve · el problema es el dato, no la policy

Reemplaza a `SQL-rls-diario-de-hijos.md`, que estaba mal fundado y quedó
anulado. **No corras aquel.**

## Cómo funciona de verdad

Las policies de `sleep_diary` no comparan correos del token. Comparan contra
`patients.auth_id`:

```
sleep_diary_self    ALL     patient_email IN (SELECT email FROM patients WHERE auth_id = auth.uid())
sleep_diary_doctor  ALL     patient_email IN (SELECT patient_email FROM doctor_patients WHERE ...)
admin_lee_diario    SELECT  es_admin()
```

Y el alta de un hijo guarda, a propósito, **el `auth_id` del adulto** en la
fila del niño. Está escrito en el código con ese comentario:

```js
// El niño no tiene cuenta propia: la fila queda a nombre del auth_id del adulto,
// así RLS (auth_id = auth.uid()) permite crearla/leerla/editarla bajo la sesión
// del padre/madre.
auth_id: parentAuthId
```

O sea: **el diseño es correcto y no necesita ninguna policy nueva.** Cuando
el padre inicia sesión, el subselect devuelve su propio correo *y* el de cada
hijo, y ve los dos diarios.

## Por qué falla igual

Porque el `auth_id` de la fila del hijo puede no ser el del padre. Tres
maneras:

1. **Quedó NULL al crear al hijo.** El código busca `S.user.auth_id` y, si no
   está, cae a `supa.auth.getUser()`. Si las dos fallan, manda `auth_id:
   null` y **la fila nace huérfana**: nadie la puede leer nunca, ni el padre.
2. **El hijo se creó antes de que existiera esa línea.** Ese `auth_id:
   parentAuthId` tiene pinta de arreglo posterior; los hijos anteriores
   tendrían NULL.
3. **El `auth_id` del adulto cambió.** Cuenta recreada, correo migrado. La
   fila del hijo quedó apuntando a un usuario que ya no es el que inicia
   sesión.

La 3 es la que mejor explica *"antes podía verse"*.

## La consulta que lo decide

En Supabase → SQL Editor (ahí corrés como `service_role`, que **ignora** la
RLS, así que ves la verdad):

```sql
select p.email,
       p.name,
       p.parent_email,
       p.auth_id,
       (select count(*) from public.sleep_diary d
         where lower(d.patient_email) = lower(p.email))  as noches,
       (select count(*) from public.evaluations e
         where lower(e.patient_email) = lower(p.email))  as escalas
from public.patients p
where lower(p.parent_email) = lower('diezjoaquinjose@gmail.com')
   or lower(p.email)        = lower('diezjoaquinjose@gmail.com')
order by p.parent_email nulls first;
```

Cómo se lee:

| Lo que ves | Qué significa |
|---|---|
| El hijo tiene el **mismo `auth_id`** que el adulto | La policy ya lo cubre. El problema es otro y hay que seguir buscando. |
| El hijo tiene `auth_id` **NULL** | Caso 1 o 2. Se arregla con el UPDATE de abajo. |
| El hijo tiene un `auth_id` **distinto** | Caso 3. Mismo UPDATE, pero mirá primero de quién es ese id. |
| El hijo tiene **0 noches** | Los datos no están donde creíamos. No corras el UPDATE: avisame. |

## El arreglo, si corresponde

**Primero mirá a quién va a tocar** (esto no cambia nada):

```sql
select h.email as hijo, h.auth_id as auth_hijo,
       p.email as adulto, p.auth_id as auth_adulto
from public.patients h
join public.patients p
  on lower(h.parent_email) = lower(p.email)
where p.parent_email is null
  and p.auth_id is not null
  and (h.auth_id is null or h.auth_id <> p.auth_id);
```

**Recién después**, y solo si las filas que salieron son las que esperabas:

```sql
update public.patients h
set auth_id = p.auth_id
from public.patients p
where lower(h.parent_email) = lower(p.email)
  and p.parent_email is null
  and p.auth_id is not null
  and (h.auth_id is null or h.auth_id <> p.auth_id);
```

Toca **solo** filas que tienen `parent_email` apuntando a un adulto real, y
les pone el `auth_id` de ese adulto. No abre ningún permiso nuevo: hace que el
dato cumpla lo que la policy ya pedía.

## Después

1. Entrá como el padre, abrí el perfil del hijo, mirá el diario. Tienen que
   aparecer las noches.
2. Guardá una noche nueva. Tiene que decir "Registro guardado ✓".
3. **Mirá también las escalas del hijo.** `evaluations` y `pvt_tests` usan el
   mismo mecanismo, así que el mismo UPDATE las destraba. Si el diario
   aparece y las escalas no, avisame: ahí sí hay algo distinto.

## Lo que hay que arreglar en el código, aparte

El alta de un hijo puede guardar `auth_id: null` sin que nadie se entere, y
eso crea una ficha que **nadie va a poder leer jamás**. Un `insert` que
"funciona" y produce un registro inaccesible es peor que un error. Lo correcto
es no permitir el alta si no se pudo resolver el `auth_id`, y decirlo. Lo
dejo anotado para el próximo mod.
