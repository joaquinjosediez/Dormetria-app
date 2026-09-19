# EEDSI · la ruta de validación

Borrador para decidir antes de escribir código. No leí el chat que compartiste
—el navegador de acá no tiene tu sesión y el enlace redirige al login— así que
todo lo de abajo sale de leer la implementación actual en `index.html`. Si el
protocolo ya definió algo distinto, mandámelo y lo ajusto.

---

## 1. Lo que ya existe

El instrumento está entero en el código, en el objeto `EEDSI`:

| Subescala | Edad | Ítems |
|---|---|---|
| **I** · Lactante | menos de 2 años | 37 |
| **P** · Preescolar | 2 a 6 | 42 |
| **S** · Escolar | 6 a 10 | 27 |
| **A** · Adolescente | más de 10 | 28 |

Las cuatro comparten los mismos nueve dominios — S1 fenomenología, S2
co-regulación, S3 capacidad regulatoria, S4 rigidez, S5 impacto diurno, S6
impacto sistémico familiar, S7 expectativas, S8 contexto, S9 banderas — más
tres preguntas de configuración (dónde duerme, dónde despierta, colecho) y
parámetros numéricos (horarios, latencia, despertares, siestas).

La subescala la elige `pickSubscale(edad)`. La versión declarada es
*"Piloto · recolección · Mayo 2026"* y no genera puntaje interpretado, lo cual
es correcto para esta etapa.

## 2. Dónde caen hoy las respuestas — y por qué no sirve

```js
patient_email: S.viewData?.email || S.user?.email,
scale_id: 'eedsi_' + sub.toLowerCase(),
answers: JSON.stringify({...})
```

Van a **`evaluations`**, identificadas por correo, dentro de la base
asistencial y bajo las mismas policies que el resto de la ficha clínica.

Para uso clínico está bien. Para el estudio no, por tres motivos:

1. Requiere cuenta, y la ruta que querés es sin login.
2. Queda reidentificable. "Anónimo" pasaría a depender de que nadie complete
   un campo, no del diseño.
3. Mezcla la cohorte del estudio con los pacientes del piloto. Cuando quieras
   exportar para analizar, no vas a poder separar quién entró por consultorio
   y quién por el QR.

## 3. Seudonimización con código de rastreo

Tenías razón en esto y mi borrador anterior planteaba una disyuntiva falsa. No
hay que elegir entre anonimato y poder borrar: **seudonimizar resuelve las dos
cosas**, que es el diseño estándar en investigación.

La mecánica:

1. Al terminar, la app genera un **código aleatorio** —por ejemplo `HXT-4821`—
   y se lo muestra al participante con un botón de copiar.
2. Ese código es lo único que queda guardado junto a las respuestas. **No se
   deriva de ningún dato personal**, así que de él no se puede volver a la
   persona.
3. Con el código, el participante puede: hacer la segunda toma (test-retest) y
   pedir que se borren sus datos.

Qué gana cada parte:

| Qué permite | Anónimo estricto | Seudonimizado con código |
|---|---|---|
| Test-retest | No | Sí |
| Borrado a pedido | No | Sí |
| Vos podés identificar a alguien | No | **Tampoco** |

**Por qué código aleatorio y no autogenerado.** La receta clásica —tres letras
del nombre de la madre + día de nacimiento— es reconstruible si se pierde, pero
codifica datos de la persona: dos participantes con la misma combinación
colisionan, y alguien con la lista de participantes podría reconstruirlo. El
aleatorio no tiene ninguna de las dos debilidades.

**El costo, y va en el consentimiento tal cual:** *si perdés el código, no
vamos a poder encontrar tus respuestas para borrarlas, porque no guardamos
ningún dato que permita reconocerte.* Eso no es una limitación a disculpar: es
exactamente lo que hace que el dato esté protegido, y así conviene decirlo.

## 4. La arquitectura, si va separada

### La tabla

```sql
create table if not exists public.eedsi_respuestas (
  id              uuid primary key default gen_random_uuid(),
  creado_en       timestamptz not null default now(),

  -- Identificación del estudio, no de la persona
  protocolo       text    not null,          -- 'EEDSI-VAL-2026'
  version_escala  text    not null,          -- EEDSI.meta.version
  origen          text,                      -- qué QR / qué centro
  -- Código aleatorio que la app le muestra al participante al terminar. Sirve
  -- para aparear la segunda toma y para atender un pedido de borrado. No se
  -- deriva de ningún dato personal: de acá no se vuelve a la persona.
  seudonimo       text    not null,

  -- Lo mínimo para asignar subescala y describir la muestra
  subescala       char(1) not null check (subescala in ('I','P','S','A')),
  edad_meses      int     not null check (edad_meses between 0 and 264),
  sexo            text,
  quien_responde  text,                      -- 'madre','padre','el adolescente'

  -- El contenido
  config          jsonb,
  params          jsonb,
  items           jsonb   not null,
  resumen         jsonb,

  -- Consentimiento: sin esto la fila no debería existir
  consintio       boolean not null default false,
  consent_version text,
  consent_fecha   timestamptz
);

-- NINGUNA columna de correo, nombre, teléfono ni patient_id. A propósito.
-- Si alguna vez hace falta agregar una, eso es una enmienda al protocolo.

alter table public.eedsi_respuestas enable row level security;

-- Cualquiera puede DEJAR una respuesta consentida. Nadie puede leerlas desde
-- la app: la lectura se hace desde el panel de Supabase con service_role.
drop policy if exists eedsi_deja_respuesta on public.eedsi_respuestas;
create policy eedsi_deja_respuesta on public.eedsi_respuestas
  for insert to anon, authenticated
  with check (
    consintio = true
    -- Lista blanca de protocolos vigentes. Cambiar de fase = agregar uno acá.
    -- Así la fase 1 y el factorial conviven en la misma tabla sin mezclarse, y
    -- nadie puede inventarse un protocolo desde el cliente.
    and protocolo in ('EEDSI-PILOTO-2026')
  );

-- Sin policy de select, update ni delete. Con RLS activo, eso significa que
-- nadie que use la clave pública puede leer, modificar ni borrar nada.

create index if not exists eedsi_seudonimo_idx
  on public.eedsi_respuestas (protocolo, seudonimo);

-- ── El borrado a pedido ───────────────────────────────────────────────
-- No hay policy de DELETE a propósito: si la app pudiera borrar con la clave
-- pública, cualquiera que viera un código ajeno podría borrar datos de otro.
-- El pedido llega por el canal de contacto del consentimiento y se ejecuta a
-- mano desde el panel de Supabase:
--
--   delete from public.eedsi_respuestas
--   where protocolo = 'EEDSI-PILOTO-2026' and seudonimo = 'HXT-4821';
--
-- Y queda anotado en el registro de bajas del estudio.
```

Dos cosas que hace bien este diseño y conviene no perder al implementarlo:

- **Sin policy de SELECT**, un error de programación no puede filtrar la
  cohorte. Ni siquiera hay que confiar en el cliente.
- El `check` sobre `consintio` hace que una respuesta sin consentimiento sea
  **imposible de guardar**, no solo "algo que la app no debería hacer".

### La ruta

`app.dormetria.com/?estudio=eedsi` — un parámetro, no un archivo aparte, para
que la app siga siendo un solo HTML.

El orden importa y es el que pide cualquier comité:

1. **Información del estudio** — quién, para qué, cuánto dura, qué se guarda,
   que es voluntario, cómo contactar al investigador.
2. **Consentimiento explícito**, con su versión. En menores, de los padres; en
   adolescentes, asentimiento + consentimiento parental.
3. Edad en meses y sexo → de ahí sale la subescala.
4. El cuestionario.
5. Cierre. **Sin devolución interpretada**: el propio `meta` dice que esta
   versión no genera score. Devolver algo que parezca un resultado sería
   exactamente lo que el instrumento todavía no puede sostener.

Y una regla que conviene grabar en el código: **si hay sesión abierta, la ruta
del estudio no debe leerla.** Si un paciente del piloto escanea el QR, entra
como participante anónimo igual. Si no, se cuela el `patient_email` por la
puerta de atrás.

## 5. El tamaño de muestra, por fase

Corrijo lo que había puesto antes: presenté el número del análisis factorial
como si fuera el ticket de entrada, y no lo es. **Son dos fases que responden
preguntas distintas y piden muestras distintas.**

### Fase 1 · Piloto de campo — ~50 por subescala

Esta fase no mide estructura. Mide si el instrumento **funciona en la mano de
quien lo contesta**:

- ¿Se entienden los ítems? ¿Cuáles quedan sin responder más seguido?
- ¿Cuánto tarda? ¿En qué dominio se abandona el cuestionario?
- ¿Hay ítems con **efecto piso o techo** — que casi todos contestan igual?
  Esos no discriminan y salen antes de llegar al factorial.
- ¿La asignación por edad cae donde tiene que caer?

Con 50 por subescala esas cuatro preguntas se responden bien. Es la fase que
hace que la fase 2 no se desperdicie: entrar al factorial con ítems que nadie
entiende es pagar 400 cuestionarios para descubrir algo que 50 ya te decían.

**200 participantes en total** para las cuatro subescalas. Eso sí es alcanzable
con el QR y tu red de colegas, y es lo que hay que planificar ahora.

### Fase 2 · Estructura factorial — 5 a 10 por ítem

[Probable] Recién acá aplica la convención habitual (Costello & Osborne 2005;
Comrey & Lee 1992), y sobre los ítems **que hayan sobrevivido a la fase 1**:

| Subescala | Ítems hoy | n (×5) | n (×10) |
|---|---|---|---|
| I · Lactante | 37 | 185 | 370 |
| P · Preescolar | 42 | 210 | 420 |
| S · Escolar | 27 | 135 | 270 |
| A · Adolescente | 28 | 140 | 280 |

Son cuatro instrumentos, no uno. **La fase 2 conviene hacerla de a una
subescala**, no las cuatro en paralelo — probablemente preescolar primero, que
es la de más ítems y más demanda clínica.

### Lo que esto significa para la app

La ruta se construye **una sola vez** y sirve para las dos fases. Lo único que
cambia entre una y otra es el valor de `protocolo` en la tabla, que separa las
cohortes sin tocar código:

- `EEDSI-PILOTO-2026` para la fase 1
- `EEDSI-VAL-P-2027` para el factorial de preescolar, y así

Por eso conviene que `protocolo` esté en el `check` de la policy desde el
primer día: cambiar de fase es cambiar una constante, y las dos cohortes quedan
separadas en la misma tabla sin riesgo de mezclarse.

## 6. Lo que necesito de tu protocolo

Con esto armo la ruta entera:

1. **Código del protocolo y versión del consentimiento**, para ponerlos en la
   lista blanca del `check` de la tabla. Propongo `EEDSI-PILOTO-2026` para la
   fase 1, pero si el protocolo aprobado tiene su propio código va ese.
2. **¿El consentimiento aprobado contempla el código de rastreo?** La
   seudonimización de la sección 3 tiene que estar descrita ahí: qué es el
   código, para qué sirve, y que si se pierde no se puede atender el borrado.
   Si el texto aprobado dice "anónimo" a secas, esto es una enmienda.
3. **Texto de la hoja de información y del consentimiento**, tal cual fue
   aprobado. No lo redacto yo.
4. **¿Se reclutan las cuatro subescalas en la fase 1?** Con ~50 cada una son
   200 en total y me parece alcanzable. Si preferís arrancar con preescolar
   sola, el QR deriva igual y las otras quedan cerradas.
5. **¿Hay instrumento de comparación** para validez convergente? Si es CSHQ o
   BISQ, ojo: en `CLAUDE.md` figura que CCTQ y MESC están deshabilitadas por
   licencia pendiente. Cualquier escala de terceros en el estudio necesita
   permiso escrito igual.
6. **¿Dónde se pega el QR?** De ahí sale el campo `origen`, que después te
   permite describir la muestra por centro de reclutamiento.
