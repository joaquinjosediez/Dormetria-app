# Beta · Motor de Orientación

## Cómo acceder

```bash
cd /Users/joaquindiez/Documents/Dormetria-app/beta
python3 -m http.server 8000
```

Luego abre en el navegador:
```
http://localhost:8000/index-beta-motor-orientacion.html
```

## Qué testear

### 1. **Cargar un paciente demo** (con escalas y diario)
   - Ir a pestaña "Resumen" de un profesional
   - Debería aparecer:
     - Toggle Generalista/Especialista (arriba)
     - 5 bloques: Orientación, Conducta, Banderas, Evolución, Material

### 2. **Orientación (Bloque 1)**
   - ✓ Detecta "patrón de insomnio" (sin asumir "crónico")
   - ✓ Muestra "¿Desde cuándo?" como pregunta clínica
   - ✓ Si STOP-BANG ≥3: agrega bandera de apnea probable
   - ✓ Si PHQ-9 ≥10: agrega bandera de síntomas depresivos

### 3. **Conducta Sugerida (Bloque 2)**
   - ✓ Siempre: TCC-I + fármaco puente ≤4 sem
   - En especialista: muestra matices (apnea, depresión, ansiedad)
   - Botón "Iniciar dCBT-I acompañado" presente

### 4. **Banderas de Seguridad (Bloque 3)**
   - ✓ ESS ≥13: "Somnolencia al volante" (naranja)
   - ✓ PHQ-9 ≥15: "Depresión moderada-severa" (rojo)
   - ✓ Benzo en >8/14 noches: "en uso frecuente" (naranja, NO rojo)
   - ✓ PHQ-9 <10: "Sin riesgo de ánimo" (verde)

### 5. **Evolución (Bloque 4)**
   - ✓ Si hay 14+ noches: muestra veredicto (Va bien / Estable / Empeorando)
   - ✓ 4 métricas: latencia, eficiencia, despertares, adherencia
   - ✓ Delta entre últimas 14 noches y 14 anteriores

### 6. **Material para Paciente (Bloque 5)**
   - ✓ 3 botones: Higiene del sueño, Restricción, Entender el insomnio
   - (Los PDFs aún no están enlazados, solo estructura)

### 7. **Modo Generalista vs Especialista**
   - Click en botones arriba derecha
   - Generalista: solo lo esencial
   - Especialista: agrega
     - "En qué se basa" en Orientación
     - Matices en Conducta
     - Criterios y fuentes (bloque nuevo)

### 8. **Criterios y Fuentes (Especialista, bloque nuevo)**
   - ✓ Visible solo en modo especialista
   - ✓ Muestra cada regla con:
     - Criterio (ej: "Insomnio (tipo)")
     - Operacionalizado (ej: "vigilia >60 min")
     - Fuente (ej: "ICSD-3")
     - Nota clínica

## Lo que falta (no en beta aún)

- [ ] Integración de la función `dmRenderSummaryResumen()` en el HTML (aún usan lógica antigua)
- [ ] Persistencia del modo Generalista/Especialista en servidor
- [ ] Links reales para PDFs de material
- [ ] Responsive mobile

## Qué revisar críticamente

1. **¿Las orientaciones generadas tiene sentido clínico?**
   - Probá con cada paciente demo
   - ¿Detecta bien el tipo de insomnio?

2. **¿Los umbrales son correctos?**
   - STOP-BANG ≥3 (ahora ≥2 es riesgo medio, ≥4 es alto)
   - ESS ≥13 para somnolencia al volante
   - PHQ-9 ≥15 para depresión severa

3. **¿Las fuentes están completas?**
   - Cada regla debe citar su criterio y fuente
   - ICSD-3, AASM, DSM-5-TR, escalas validadas

4. **¿Falta algún criterio clínico importante?**
   - Convivientes (RLS, ICSD-3)
   - Medicaciones específicas (antihistamínicos, antidepresivos)
   - Comorbilidades (EPOC, diabetes)

## Archivos

- **Beta HTML**: `beta/index-beta-motor-orientacion.html`
- **Motor JS**: `beta/js/dormetria-motor-orientacion.js`
- **Documentación**: `MOD183-RESUMEN-motor-orientacion.md`

## Pasos después de aprobación en beta

1. Integrar función de renderizado en showDrPTab_
2. Agregar persistencia server-side del modo
3. Testing completo con todos los pacientes demo
4. Release como mod183 → producción
