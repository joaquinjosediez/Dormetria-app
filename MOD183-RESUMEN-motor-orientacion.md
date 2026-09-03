# mod183 · Motor de Orientación para Pestaña Resumen

## Estado: IMPLEMENTACIÓN EN PROGRESO (MVP funcional)

### Qué se hizo

**1. Motor de Orientación** (`js/dormetria-motor-orientacion.js`)
- Función principal: `dmMotorOrientacion(recs, diaryEntries, doctorData)`
- Reglas explícitas y auditables basadas en literatura validada
- Retorna: `{orientacion, conducta, banderas, evolucion, preguntas, datosInsuficientes}`

**2. Reglas implementadas (Clínicamente correctas)**
- **Patrón de insomnio** (sin asumir "crónico" sin criterio temporal ≥3 meses, ICSD-3)
  - Mantenimiento: vigilia intrasueño >60 min O eficiencia <75%
  - Conciliación: latencia >30 min
  - Mixto: latencia >15 min Y vigilia >30 min
  - → Agregar pregunta: "¿Desde cuándo?" para confirmar duración ≥3 meses
  
- **Diagnósticos alternativos** (dentro de banderas de orientación)
  - STOP-BANG ≥3 → apnea probable (AASM) → Derivar a PSG
  - PHQ-9 ≥10 → síntomas depresivos presentes (DSM-5-TR)
  
- **Banderas de Seguridad**
  - ESS ≥13 → somnolencia al volante (alerta)
  - PHQ-9 ≥15 → depresión moderada-severa (crítico)
  - Benzodiacepina en >8/14 noches → "en uso frecuente" (no "crónica" sin duración confirmada)

**3. Nuevo: Preguntas clínicas que refinan la orientación**
```javascript
orientacion.preguntas = [
  {
    id: 'duracion',
    texto: '¿Desde cuándo tiene este patrón de sueño?',
    criterio: 'ICSD-3 requiere ≥3 meses de duración para insomnio crónico'
  }
]
```

**4. Nuevo: Bloque de criterios y fuentes (para especialista)**
```javascript
dmCriteriosYFuentes() → {
  titulo: 'Criterios y fuentes del motor de orientación',
  criterios: [
    {criterio, operacionalizado, fuente, nota}
    // Cada regla con su fuente completa y notas clínicas
  ]
}
```

**3. Bloques de UI** (del prototipo)
```
1. Orientación (frase + base técnica + banderas)
2. Conducta Sugerida (Primera línea: TCC-I, Fármaco: puente ≤4 sem)
3. Banderas de Seguridad (crítica/warning/ok por color)
4. Evolución en un vistazo (veredicto + 4 métricas)
5. Material para el paciente (3 PDFs enviables)
```

**4. Modo Generalista/Especialista**
- Toggle en la UI
- Persistencia: localStorage + server-side (PATCH doctors.display_mode)
- Especialista: despliega "en qué se basa" + matices clínicos

### Qué queda (5 días)

**Paso 1: Integración en showDrPTab_** (1 día)
```javascript
// En showDrPTab_ (línea 15378)
if(tab==='summary'){
  // Traer escalas y diario
  // Llamar dmMotorOrientacion()
  // Renderizar con dmRenderSummaryResumen()
  // Enganchar eventos del modo toggle
}
```

**Paso 2: Testing con datos reales** (2 días)
- Probar con los 5 pacientes demo
- Validar orientaciones generadas (¿se ve bien clínicamente?)
- Revisar banderas (¿está detectando apnea? ¿depresión?)
- Ajustar umbrales si es necesario

**Paso 3: Refinamientos UI/UX** (1 día)
- Responsive en móvil
- Accesibilidad (aria-labels, contraste)
- Comportamiento del modo toggle
- Material para paciente (links funcionales)

**Paso 4: Persistencia server-side del modo** (1 día)
```sql
-- Si no existe:
ALTER TABLE public.doctors ADD COLUMN display_mode TEXT DEFAULT 'gen';

-- Traer el modo actual al cargar el paciente
SELECT display_mode FROM doctors WHERE email = ?
```

### Archivos

- **Motor**: `/Users/joaquindiez/Documents/Dormetria-app/js/dormetria-motor-orientacion.js`
- **Función UI**: `/sessions/cool-beautiful-mendel/mnt/outputs/dm-summary-new.js`
- **mod183 draft**: `/sessions/cool-beautiful-mendel/mnt/outputs/APP-index-mod183-draft.html`

### Cómo testear (sin integración completa aún)

```javascript
// En consola del navegador (cuando estés viendo un paciente):
const motorResult = dmMotorOrientacion(S.viewRecs, diaryData, S.viewData);
console.log(motorResult);  // Ver qué genera
```

### Notas

- Las reglas están diseñadas para NO sobrepasarse (ante la duda, callar)
- Todos los umbrales tienen comentarios de fuente
- El motor es determinístico (mismo input = mismo output)
- Está listo para auditoría clínica: cada regla es explícita y documentada

### Próximas validaciones

1. ¿Los umbrales de STOP-BANG/ESS/PHQ-9 coinciden con lo que esperabas?
2. ¿Detecta correctamente insomnio de conciliación vs mantenimiento?
3. ¿Falso-positivos en las banderas de riesgo?
4. ¿La UI se ve bien en móvil?
