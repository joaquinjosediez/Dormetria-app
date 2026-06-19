# Dormetria — Documento de traspaso (para continuar en otro chat)

_Última actualización: 19 de junio 2026 · versión de deploy alcanzada: `?v=hoy36`_

---

## Cómo arrancar el chat nuevo

Pegá este documento al inicio del chat nuevo y subí el `index.html` actual (el que está en outputs). Con eso el asistente tiene todo el contexto sin necesitar el historial viejo.

---

## Qué es Dormetria

PWA clínica de medicina del sueño, archivo único `index.html` (HTML/JS/CSS, ~14.700 líneas). Desarrollada y mantenida por el Dr. Joaquín J. Diez (psiquiatra y especialista en sueño, Argentina). Backend: Supabase. Deploy por GitHub Pages.

**Comunicación preferida:** español rioplatense, directo, copy-pasteable. El asistente debe actuar como asesor que cuestiona supuestos, etiqueta confianza [Seguro]/[Probable]/[Suposición], y evita "tenés razón/buena pregunta/por supuesto".

---

## Datos técnicos clave

- **Login médico (admin, el único):** `drjoaquindiez@gmail.com`
- **Cuenta de paciente de prueba (Supabase Auth):** `diezjoaquinjose@gmail.com`
- **Proyecto Supabase:** `sojvsbwpqdwjuvezdhby`
- **Deploy:** desde `~/Documents/Dormetria-app/` con un push de git. Comando de una línea:
  ```bash
  cd ~/Documents/Dormetria-app && git add . && git commit -m "update" && git pull --no-rebase -X ours --no-edit && git push
  ```
  Luego esperar 1-2 min y recargar con `?v=hoyN` (subir el número cada vez; el último fue `hoy36`).
- **Landing:** dormetria.com (Netlify). Formspree feedback: `mykvzkqk`. Jotform encuestas: profesionales `261455034864055`, EEDSI pediátrico `261510954774058`.
- **IPAMES NO debe mencionarse nunca.**
- **Paleta:** Verde Noche `#0F2820`, Verde Medio `#1F4738`/`#2D6B55`, Verde Base `#1A4A3A`, Oro `#C8A96E`, Menta `#7EC8A4`, Crema `#F4EFE5`. Color menstrual/período: `#c2547d` (rosa/vino). Fuentes: Cormorant Garamond + Instrument Sans.

## Flujo de validación del asistente

Antes de cada entrega: extraer los `<script>` con regex de Python → `/tmp/app.js` → `node --check /tmp/app.js`. Luego copiar el final a `/mnt/user-data/outputs/index.html` y presentarlo. Trabajar sobre una copia escribible en `/home/claude/index.html`.

---

## ✅ EL GRAN BUG YA RESUELTO (no volver a tocar)

Durante semanas, las sugerencias de escalas del médico, el módulo TCC-I (CBT-I) y "Mis profesionales" NUNCA aparecían del lado paciente.

**Causa raíz (era de DATOS, no de código):** el perfil de paciente tenía guardado el email `drjoaquindiez@gmail.com`, pero el login de Supabase Auth era `diezjoaquinjose@gmail.com`. La RLS de Supabase compara `lower(patient_email) = lower(auth.jwt()->>'email')` contra el email del **login**. Como no coincidían, toda lectura del lado paciente devolvía 0 filas.

**Solución aplicada:** se cambió el email del perfil de paciente de `drjoaquindiez@gmail.com` a `diezjoaquinjose@gmail.com`. Esto chocó repetidamente con foreign keys. La solución definitiva que funcionó fue recrear todas las FK que apuntan a `patients` con `ON UPDATE CASCADE` mediante un bloque DO dinámico, y luego un `UPDATE patients SET email=...`. Quedó resuelto: el cartel de diagnóstico dorado desapareció y aparecieron sugerencias, TCC-I y el médico vinculado.

**Política RLS agregada (clave):** "parents read their children" en la tabla `patients`:
```sql
CREATE POLICY "parents read their children" ON patients FOR SELECT TO authenticated
USING (lower(parent_email) = lower(auth.jwt() ->> 'email'));
```
Sin esta política, un padre no podía leer los perfiles de sus hijos.

**Lección para el futuro:** el alta de paciente debería tomar el email SIEMPRE de la sesión de Supabase Auth, no de un campo aparte. Pendiente blindar el flujo de registro para que el email del perfil = email del login. (No hecho aún.)

---

## 🔧 EL PROBLEMA ACTIVO (donde quedamos) — selector de perfiles infantiles

**Decisión de diseño tomada (Opción B):** alternar entre hijos desde el **encabezado** (el nombre del hijo con una flechita ▾), no desde una pestaña. Con un solo hijo, no se muestra flecha ni selector.

**Lo implementado y funcionando:**
- Botón "+ Agregar perfil de un hijo/a" en "Mi especialista" Y dentro del selector del header.
- Botón "🗑 Eliminar" en cada perfil infantil (función `deleteChildProfile`, con confirmación, borra referencias + fila). `db.del` agregado al objeto `db`.
- Bloqueo de nombres duplicados: `saveChildProfile` normaliza el nombre (sin tildes/espacios) para el email del hijo, y chequea duplicados antes de crear. Esto evita el problema previo de dos "Eloísa" (una con tilde, otra sin).
- El selector del header (`openChildSwitcher`) muestra todos los hijos con iniciales de colores + "Agregar otro".
- Se guarda `S._parentEmail` (email del adulto) por separado, para que la carga de hermanos no se confunda cuando `S.user` es el niño.

**EL BUG QUE FALTA RESOLVER:** la pestaña inferior se queda fija en "Jeronimo" (el primer hijo). Al cambiar a Eloísa, "parpadea Eloísa medio segundo y vuelve a Jeronimo". 

Causas ya corregidas en el intento actual (`hoy36`): `getFirstChildName()` ahora usa el hijo activo; `openChildProfile()` abre el selector con 2+ hijos en vez de saltar al primero; `loadLinkedChildProfiles()` usa `S._parentEmail` en modo niño. PERO el usuario reporta que **sigue pasando lo mismo** después de `hoy36`.

**Próximo paso de diagnóstico (pedido al usuario, sin respuesta aún):** se agregaron logs `console.log('[switchToChild] ...')`. Hay que pedirle al usuario que abra la consola de Safari, cambie a Eloísa, y copie las líneas `[switchToChild]`. Eso dirá si `switchToChild` se llama una vez (problema de display) o dos veces (algo re-dispara el primer hijo). 

**Sospechosos restantes a revisar:** 
- `showChildFromHome()` (línea ~11253) todavía hace `switchToChild(S._linkedChildren[0].email)` — fuerza el primer hijo.
- Verificar si algo en el arranque/login auto-switchea al primer hijo.
- Confirmar si al "volver a Jeronimo" el contenido entero vuelve (problema de datos) o solo la etiqueta de la pestaña (problema de label). Pregunta hecha al usuario, sin responder.

---

## Funciones y ubicaciones relevantes (referencia rápida)

- `db` (objeto, ~línea 3405): métodos `get/post/patch/upsert/del`. `_getAuthHeader()` usa el token de sesión del usuario (verificado correcto).
- Detección de rol en login (~4228): busca primero en `patients` por `auth_id` con `parent_email IS NULL` → paciente; luego `doctors` → médico.
- `loadDoctorSuggestions` (~9407): query SIN `created_at` (por si la columna no existe), con auto-diagnóstico de email mismatch. Tarjetas con colores `!important` para no ser pisadas por el tema oscuro del home.
- `checkPatientTcciCard` (~14280): tarjeta TCC-I del paciente, robusta con reintento.
- `showChildHome` (~11258): home infantil. Header con `ch-name` + `ch-name-caret` (flechita).
- `openChildSwitcher` / `_pickChild` / `switchToChild` (~5556-5605): selector de hijos.
- `openChildProfile` (~5529): destino de la pestaña inferior de hijos.
- `getFirstChildName` / `updateNavTabs` (~6068, ~6080): etiqueta y armado de la pestaña.
- `loadLinkedChildProfiles` (~5512): carga lista de hijos (usa `S._parentEmail` en modo niño).
- `saveChildProfile` (~10261): alta de hijo, con normalización de nombre y bloqueo de duplicados.
- `deleteChildProfile`: borrado de hijo desde la app.
- `showPatientCode` (~6216): pantalla "Mi especialista" / "Mi código" — lista de hijos con Editar/Eliminar, botón agregar, directorio.

## Estado `S` (variables relevantes)
`S.user` (perfil activo; en modo niño ES el niño), `S._parentEmail` (email del adulto, NUEVO), `S._activeChildEmail` (NUEVO), `S._linkedChildren` (cache de hijos), `S.childMode`, `S.ageGroup`, `S.role`, `S.viewData` (médico viendo paciente), `S._editingDiaryId`, `_periodActive`.

---

## Otras features completadas en esta sesión (ya en el archivo, funcionando)

1. **Seguimiento menstrual:** toggle en "Mi perfil" (solo sexo femenino) → flag `track_menstrual`. Chip discreto "🩸 Marcar período menstrual" en el diario. Se guarda como marcador `🩸Período` dentro de `notes` (sin columna nueva). Las noches con período se pintan rosa/vino (`#c2547d`) en el actograma del paciente Y del médico, con leyenda que aparece solo si hay datos. Integración con Flo/Apple Health: planificada para más adelante (HealthKit es el camino realista; Flo no tiene API pública).

2. **Gráfico NSF infantil:** el diario del niño muestra sueño TOTAL (noche + siestas) con banda recomendada NSF superpuesta según edad (`NSF_RANGES`), puntos coloreados verde/naranja/rojo según rango.

3. **Edición de registros del diario infantil:** botón ✏️ + `editChildDiaryEntry` que precarga el form; `saveChildDiary` hace PATCH cuando `S._editingDiaryId` está seteado.

4. **Métricas clínicas del diario (idénticas en paciente y médico):** `computeDiaryMetrics` + `renderClinicalMetricsHtml`. Hora promedio de acostarse/levantarse, sueño total promedio, promedios días laborables/no laborables, diferencia (deuda de sueño/insuficiencia), jet lag social, % noches <7h. El panel del médico fue reordenado para quedar idéntico al del paciente: Score (toggle 7/30/Todo) → Pilares → Métricas → Actograma.

5. **Botón "Mis sugerencias"** del médico: aparece siempre en la pantalla de sugerir escalas (si hay bundle configurado lo aplica; si no, lleva a configurarlo).

6. **Escalas:** removida BDI-II (copyright Pearson) y la pestaña de wearables. Agregadas AIS (Athens Insomnia Scale) y JSS (Jenkins Sleep Scale), ambas de uso libre.

---

## Pendientes / próximos temas mencionados

- **Cerrar el bug del selector de hijos** (lo de arriba, prioridad).
- Revisar por qué Bárbara Müller (paciente real) tiene dificultades para entrar — posiblemente el mismo problema de email mismatch. Antes de borrar su perfil o el de su hija Jazmín, conviene diagnosticar el error de login (no perder datos de una menor real).
- Documento Word "Dormetria_100_frases_sueno.docx" (100 frases curiosas de sueño) — el usuario quería revisar el tono antes de reemplazar la "frase del día" en la app. Sin integrar aún.
- Blindar el flujo de registro de paciente para que el email del perfil = email del login de Supabase Auth (evita que se repita el gran bug).
- Trabajo legal/compliance en curso (licencias de escalas, documentos de privacidad) — contexto de fondo, no activo en esta sesión.

---

## Advertencias permanentes

- Es una app clínica con **pacientes reales, incluidos menores**. Cualquier borrado de datos es irreversible y puede afectar datos clínicos reales. Confirmar siempre antes de borrar.
- El asistente NO puede ejecutar SQL en Supabase; el usuario lo corre desde el SQL Editor. Dar los bloques completos y en orden.
- Child safety: la app maneja perfiles de menores; mantener todo apropiado y cuidadoso.
