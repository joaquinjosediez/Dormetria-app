# Dormetria — contexto del proyecto

Este archivo se carga automáticamente por Claude Code al trabajar en este repo. Mantenerlo actualizado es más importante que mantenerlo extenso — texto desactualizado es peor que no tener texto.

## Qué es Dormetria
App clínica de sueño y salud mental (adultos + pediátrico), single HTML file (`index.html`, ~16k+ líneas) con backend Supabase, desplegada como PWA vía Netlify. En uso piloto activo con pacientes reales — cualquier cambio en producción tiene impacto clínico directo, no solo técnico.

## Infraestructura
- Producción: `joaquinjosediez.github.io/Dormetria-app` · Supabase project `sojvsbwpqdwjuvezdhby`
- Landing: dormetria.com (Netlify, dominio DonWeb)
- Staging: `/staging/`, JS-idéntico a producción · Supabase project separado `dormetria-staging` (datos ficticios) · toggle de entorno en `index.html` · banner rojo visual para distinguir entorno
- `schema_version:2` distingue semántica nueva (`wake_time`/`get_up_time`) de registros legacy — verificar antes de tocar queries relacionadas a horarios de sueño

## REGLA CRÍTICA: integridad del bloque `<script>`
El archivo `index.html` tiene un historial recurrente de corrupción del bloque `<script>` al hacer reemplazos de string vía Python/Node. Antes de CUALQUIER edición dentro de `<script>...</script>`:

1. Usar `const SU=` como marcador de inicio del bloque JS
2. Usar `lastIndexOf('\n</script>')` como marcador de fin
3. Correr `node --check` sobre el archivo resultante antes de dar el cambio por bueno
4. Verificar balance de llaves `{}` carácter por carácter
5. Nunca aplicar un reemplazo de string directo y genérico sobre este bloque sin pasar por los pasos anteriores

Si algo de esto falla, reportar la línea exacta del desbalance y detenerse — no intentar un auto-fix silencioso.

## No tocar sin confirmación explícita
- **Logo SVG**: wordmark "dormetria" con la "o" reemplazada por una máscara de luna creciente (Playfair Display 500, punto blanco en la "i"). La forma de la luna no se altera nunca entre variantes — solo rotación, color, y color del punto.
- **"IPAMES"**: ya no existe. No debe aparecer en ningún material vinculado a Dormetria ni al perfil profesional de Joaquín.
- **CCTQ y MESC**: escalas deshabilitadas como scaffold, pendientes de licencia escrita de Werner (Kinderspital Zürich) y Carskadon (Brown University). No activar.
- **Dormetria en contexto clínico/ético**: no debe aparecer en materiales clínicos ni en el protocolo de ética — ahí solo figura la afiliación a Universidad Austral.

## Identidad de marca (para cualquier UI/landing/material)
- Colores: Verde Noche `#0F2820`, Verde Base `#1A4A3A`, Verde Medio `#2D6B55`, Menta `#7EC8A4`, Crema `#F4EFE5`, Oro `#C8A96E`
- Tipografía: Cormorant Garamond (display), Instrument Sans (UI)
- Colores de alerta semántica (ámbar/rojo) se mantienen separados de la paleta de marca — no mezclar

## Compliance y seguridad (no negociable)
- RLS activo en las 12 tablas de Supabase — cualquier cambio de schema debe preservar o extender las policies, nunca debilitarlas
- Ley 25.326 y Ley 26.529 (Argentina) aplican; exposición regulatoria mapeada también en Chile, Uruguay, España y México
- No exponer passwords en texto plano bajo ninguna circunstancia — ya hubo un incidente de este tipo, corregido
- Auditoría externa de referencia: revisión de Ignacio Vitale sobre baseline v78 (no es auditoría formal)

## Estado técnico conocido
El registro de bugs vive en `BUGS.md`, en la raíz del repo. No duplicar esa lista acá — este archivo es contexto general, `BUGS.md` es la fuente de verdad para triage.

## Convenciones de trabajo
- Cambios en producción requieren pasar primero por `/staging/` cuando el cambio toca lógica de negocio o datos de pacientes
- Cualquier hallazgo de exposición de datos o falla de RLS se reporta de inmediato, no se resuelve en silencio
