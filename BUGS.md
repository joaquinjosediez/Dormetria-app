# Registro de bugs — Dormetria

Formato por ítem: estado, prioridad, fecha de detección, descripción, impacto clínico si aplica.

Prioridad: 🔴 crítico (afecta datos/seguridad de pacientes) · 🟡 importante (afecta uso pero hay workaround) · ⚪ menor (cosmético / no bloqueante)

Estado: `abierto` · `en progreso` · `diferido` · `resuelto`

---

## Abiertos / diferidos

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
  - `doctor_patients` (rol `authenticated`) — **hallazgo pendiente, no corregido**: la policy `dp_medico_vincula` (INSERT) solo valida `doctor_email = self`, no valida consentimiento del paciente (sin chequeo de código de vinculación a nivel de base) — un doctor autenticado podría insertar un vínculo a cualquier `patient_email` por API directa, saltándose el flujo de código que hoy solo se aplica en el cliente. No se corrigió porque el alcance real depende de las policies de `patients`/`sleep_diary`/`evaluations` (no revisadas todavía) — requiere ver esas policies antes de tocar nada acá.

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
