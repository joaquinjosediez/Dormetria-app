# Registro de bugs — Dormetria

Formato por ítem: estado, prioridad, fecha de detección, descripción, impacto clínico si aplica.

Prioridad: 🔴 crítico (afecta datos/seguridad de pacientes) · 🟡 importante (afecta uso pero hay workaround) · ⚪ menor (cosmético / no bloqueante)

Estado: `abierto` · `en progreso` · `diferido` · `resuelto`

---

## Abiertos / diferidos

### Diario de sueño de hijos no se puede guardar — RLS en sleep_diary
- Estado: abierto
- Prioridad: 🔴
- Descripción: falta en `sleep_diary` la excepción padre/hijo que `patients` ya tiene (policy `"parents read their children"`). Un padre que carga el diario de un hijo hace INSERT con `patient_email` del hijo, pero el login sigue siendo el del padre — la RLS actual compara `patient_email` contra `auth.jwt()->>'email'` y rechaza el insert. Diagnóstico completo y SQL de fix (4 policies nuevas, permisivas, no tocan las existentes) en `SQL-rls-diario-de-hijos.md`.
- Impacto clínico: paciente pediátrico real afectado (mencionado en el diagnóstico) — no puede registrar sueño, pérdida directa de datos clínicos del piloto.
- Avance (2026-09-12): diagnóstico documentado en `SQL-rls-diario-de-hijos.md`, SQL listo para correr en Supabase (pendiente de ejecución — no aplicado todavía). El propio documento señala revisar `evaluations` y `pvt_tests` por el mismo problema una vez confirmado esto.

### `patient_education` — una policy `for all` anula a las que sí verifican el vínculo
- Estado: abierto
- Prioridad: 🔴
- Fecha: 2026-10-01
- Descripción: al crear la tabla (`SQL-material-educativo.md`) quedó con **8 policies**: las 4 del documento y 4 preexistentes. Una de ellas, `doctor manages own assignments`, es `for all` con `using`/`with check` = `lower(doctor_email) = lower(auth.jwt()->>'email')`. Para SELECT/UPDATE/DELETE eso es correcto —solo toca filas propias—, pero en **INSERT** el `with check` no mira `patient_email`: un profesional puede insertar una fila con cualquier correo del sistema mientras firme con el suyo. `pedu_doctor_asigna`, que sí exige el vínculo en `doctor_patients`, queda sin efecto, porque **las policies PERMISSIVE se combinan con OR**: basta que una permita.
- Impacto: (a) un profesional puede meter material en la pantalla de inicio de un paciente que no es suyo; (b) queda un **oráculo de enumeración** — insertar una fila con un correo cualquiera y leerla después (es propia, así que la policy la deja): si `read_at` se completa, ese correo pertenece a un paciente activo de Dormetria. Eso es dato de salud por inferencia (Ley 25.326 art. 7) sin relación asistencial. **No hay lectura de datos clínicos ajenos**: para leer filas de otros hace falta el vínculo o ser dueño de la fila.
- Fix: una línea, en `SQL-material-educativo.md` (sección "Las policies que ya existían"). Después tiene que quedar en 7 policies.
- **Depende del hallazgo de `doctor_patients` de más abajo.** Exigir el vínculo solo sirve si el vínculo no se puede fabricar. Hoy `dp_medico_vincula` (INSERT) no valida el consentimiento del paciente, así que un profesional puede crear el vínculo por API y después asignar. Borrar la policy `for all` cierra la puerta directa y deja rastro en `doctor_patients`, pero **el oráculo no queda cerrado hasta arreglar `dp_medico_vincula`**. Los dos son el mismo problema: la validación del código de vinculación vive solo en el cliente.

### Centrado de eje del actograma
- Estado: diferido
- Prioridad: ⚪
- Descripción: pendiente decisión de diseño entre auto-shift vs. rango extendido
- Impacto clínico: ninguno, solo visualización

### Gráfico de progresión semanal solo visible para el doctor
- Estado: diferido
- Prioridad: 🟡
- Descripción: falta versión paciente del gráfico de progresión CBT-I
- Impacto clínico: paciente no puede autoevaluar su avance

### Navegación en perfil pediátrico — botón "atrás"
- Estado: abierto
- Prioridad: 🟡
- Descripción: el botón atrás desde perfil de hijo manda al perfil adulto en vez de volver a la pantalla anterior correcta
- Impacto clínico: ninguno, solo UX

### Detalle de respuestas PSQI en vista del doctor
- Estado: diferido
- Prioridad: ⚪
- Descripción: falta desglose de respuestas individuales del PSQI en el panel del doctor

### Policy RLS del directorio de consultas
- Estado: en progreso
- Prioridad: 🔴
- Descripción: revisar y confirmar policy de RLS para el directorio de consultas. Alcance confirmado: tablas `doctors`, `doctor_patients`, `doctor_alerts`, `doctor_suggestions`.
- Impacto clínico: potencial exposición de datos si la policy es incorrecta
- Avance (2026-09-04):
  - Anon (sin sesión): las 4 tablas devuelven vacío para cualquier filtro por REST — sin fuga por ese lado.
  - `doctors` (rol `authenticated`) — **VULNERABILIDAD CONFIRMADA Y RESUELTA**: la policy `anyone reads listed doctors` (SELECT) tenía `USING (true)`, sin filtro — cualquier usuario autenticado podía leer todas las columnas de todos los profesionales, incluidos los no aprobados/no listados (teléfono, CV, email, matrícula). Corregida en producción vía SQL Editor de Supabase: `USING (public_profile = true OR listed = 'true')`. Verificado el `qual` resultante en `pg_policies`: `((public_profile = true) OR (listed = 'true'::text))`. Las policies `doctors_self` y `admin lee todos los profesionales` no se tocaron y siguen cubriendo el acceso propio/admin (se combinan por OR).
  - `doctor_alerts` y `doctor_suggestions` (rol `authenticated`): policies revisadas, correctamente scoped a doctor/paciente propio. Sin hallazgos.
  - `doctor_patients` (rol `authenticated`) — **hallazgo pendiente, no corregido**: la policy `dp_medico_vincula` (INSERT) solo valida `doctor_email = self`, no valida consentimiento del paciente (sin chequeo de código de vinculación a nivel de base) — un doctor autenticado podría insertar un vínculo a cualquier `patient_email` por API directa, saltándose el flujo de código que hoy solo se aplica en el cliente. No se corrigió porque el alcance real depende de las policies de `patients`/`sleep_diary`/`evaluations` (no revisadas todavía) — requiere ver esas policies antes de tocar nada acá. **Actualización 2026-10-01:** este hallazgo es la raíz del de `patient_education` (ver arriba). Mientras el vínculo se pueda fabricar por API, toda policy que se apoye en `doctor_patients` hereda el agujero. La validación del código de 6 caracteres tiene que bajar a la base — una función `security definer` que verifique el código, o una columna de consentimiento que el paciente escriba.

### Sistema de tagging/highlighting de pacientes
- Estado: diferido
- Prioridad: ⚪
- Descripción: feature no crítica, deseable para organización del panel del doctor

### Alineación de botones — formulario de despertares/siestas infantil
- Estado: abierto
- Prioridad: ⚪
- Descripción: bug visual/cosmético

### Switcher de perfil de hijo revirtiendo al primer hijo
- Estado: en progreso
- Prioridad: 🟡
- Descripción: al cambiar entre perfiles de hijos, revierte al primero en vez de mantener el seleccionado. Logs de diagnóstico agregados, causa raíz sin resolver.
- Impacto clínico: puede llevar a registrar datos bajo el perfil de hijo equivocado
- Avance (2026-09-04): causa raíz encontrada — `renderChildScales()` (index.html) leía `S.records`, la caché global de evaluaciones del perfil ADULTO, que nunca se recarga ni se limpia en `switchToChild`/`switchToParentProfile`. Con 2+ hijos, la pantalla de escalas de cualquiera terminaba mostrando los resultados del primer perfil cargado en la sesión — coincide con el síntoma reportado. Fix aplicado: `renderChildScales` ahora pide siempre las evaluaciones frescas por `patient_email` del hijo activo (mismo patrón que `renderChildDiaryList`, que no tenía este problema). Verificado `node --check` sobre el bloque `<script>` tras el cambio (íntegro). Pendiente: validar en `/staging/` con 2+ hijos reales antes de subir a producción — no se probó en navegador desde este entorno.

---

## Resueltos

(mover acá los ítems cerrados, con fecha de resolución)

---

## Notas
- Este registro reemplaza la referencia previa a "doce ítems, cinco resueltos, siete diferidos" — esa cifra no tenía detalle recuperable y se descarta como fuente.
- Actualizar este archivo es responsabilidad manual por ahora; el agente de triage lee de acá, no inventa ítems nuevos por sí solo.
