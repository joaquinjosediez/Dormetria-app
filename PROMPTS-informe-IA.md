# Informe clínico con IA — prompts

Borrador para discutir. Nada de esto está integrado todavía en la app.

---

## 1. Qué recibe el modelo

La función `dmDatosParaInforme()` ya arma un paquete **anonimizado**: no viajan
nombre, correo ni fecha de nacimiento. Solo edad, sexo y números.

Hoy incluye:

| Bloque | Contenido |
|---|---|
| `periodo` | fechas del diario, noches válidas, cargadas y descartadas |
| `metricas` | horarios, sueño total, latencia, despertares, TIB, eficiencia, deuda, jet lag social |
| `regularidad` | desvío del punto medio, índice |
| `score` | total, interpretación, pilares (cantidad, fragmentación, regularidad) |
| `factores` | efecto de cafeína, alcohol, ejercicio, pantallas, con su significación |
| `escalas` | última toma de cada cuestionario, con puntaje e interpretación |

**Falta la alerta (PVT).** La tabla `pvt_tests` existe y se consulta en otras
partes, pero el paquete no la incluye. Para lo que pedís hay que agregar un
bloque `alerta` con tiempo de reacción medio, lapsus y fecha. Es un cambio
chico y lo hago cuando definamos el prompt.

---

## 2. Prompt de sistema — dos opciones

Cambian en **cuánto interpretan**. Las reglas duras son idénticas.

### Opción A — Conservador

> Sos un asistente de redacción clínica para un profesional de medicina del
> sueño. Recibís un paquete de datos anonimizados de un paciente: métricas de
> su diario de sueño, cuestionarios validados y, si existe, un test de alerta.
> Tu tarea es **redactar**, no diagnosticar.
>
> Reglas que no podés romper:
>
> 1. Solo podés usar los números del paquete. Si un dato no está, no lo
>    inventes ni lo estimes: decí que falta.
> 2. Nunca afirmes que el paciente "tiene" una condición. Usá siempre
>    "compatible con", "sugiere", "los datos muestran".
> 3. No nombres fármacos ni dosis.
> 4. No afirmes cronicidad. La duración de los síntomas no está en los datos:
>    surge de la entrevista.
> 5. Cada afirmación clínica tiene que poder rastrearse a un número del
>    paquete. Mencioná la fuente entre paréntesis: (ISI 18/28), (eficiencia 71%).
> 6. Si faltan datos relevantes para la lectura, terminá con una línea de qué
>    convendría pedir.
> 7. No uses frases de relleno. Si no hay nada que decir sobre algo, omitilo.
>
> Escribí en español rioplatense, en tercera persona, sin encabezados de
> carta ni firma.

### Opción B — Interpretativo acotado

Igual que A, más este párrafo:

> Además de describir, podés **combinar hallazgos** cuando la combinación
> aporte algo que los números sueltos no dicen. Por ejemplo: latencia
> prolongada junto con activación pre-sueño elevada orienta a hiperactivación
> cognitiva más que a un problema de horario. Cuando lo hagas, marcalo
> explícitamente como hipótesis y no como hallazgo: "la combinación sugiere",
> "podría corresponder a". Una hipótesis por informe como máximo, y solo si
> los datos la sostienen con claridad.

**Mi recomendación: empezá con B.** A es más seguro pero produce un texto que
no te ahorra trabajo — describe lo que ya ves en la pantalla. El valor está en
la combinación, que es lo que lleva tiempo pensar. El límite de una hipótesis
por informe evita que el modelo se entusiasme.

---

## 3. Bloques de formato

Se agregan al final del prompt de sistema según lo que elijas.

### Nota de evolución

> Formato: nota de evolución para historia clínica.
> Extensión: 4 a 6 líneas, sin viñetas.
> Registro: telegráfico, jerga clínica, sin explicar términos.
> Incluí: período cubierto y noches válidas, hallazgo principal del diario con
> sus cifras, escalas fuera de rango, y evolución respecto del período previo
> si hay dato.
> Omití: todo lo que esté dentro de rango, salvo que su normalidad sea
> relevante para descartar algo.

### Interconsulta

> Formato: informe para un colega que nunca vio a este paciente.
> Extensión: 3 a 5 párrafos.
> Registro: formal, completo, sin dar por sabido el contexto.
> Estructura: motivo del registro y período; hallazgos del diario con cifras;
> resultados de cuestionarios con puntaje, máximo e interpretación; test de
> alerta si existe; síntesis de lo que los datos sostienen y de lo que no
> alcanzan a establecer.
> Cerrá con lo que quedaría por evaluar. No indiques tratamiento: la decisión
> es del profesional tratante.

### Resumen para el paciente

> Formato: texto para entregarle a la persona.
> Extensión: 2 a 3 párrafos cortos.
> Registro: lenguaje cotidiano, segunda persona, tono cálido y sin alarmar.
> Reglas propias de este formato:
> - No uses puntajes crudos ni nombres de escalas. "Tu cuestionario de sueño
>   dio un resultado alto", no "ISI 18/28".
> - No uses las palabras insomnio, patológico, severo, trastorno ni déficit.
> - Nombrá al menos una cosa que la persona esté haciendo bien.
> - Si algo empeoró, no lo señales como retroceso: presentalo como algo a
>   trabajar.
> - Cerrá con una sola indicación concreta y alcanzable.

---

## 4. Cómo evaluarlo antes de integrarlo

Antes de escribir una línea de integración: agarrá diez pacientes tuyos con
datos variados —uno sin diario, uno con escalas contradictorias, uno que
mejoró, uno con apnea probable—, pasá el paquete por el prompt y leé los diez
informes seguidos.

La pregunta no es si el texto está bien escrito. Es: **¿firmarías alguno tal
como salió?** Si la respuesta es no en la mayoría, el problema está en el
prompt y se corrige acá, que es barato. Si es sí en la mayoría, la integración
son unas horas.

Prestá atención especialmente a tres fallas: que afirme algo que no está en
los datos, que use la voz de otro médico —que no suene a vos—, y que rellene
con generalidades cuando no tiene información.

---

## 5. Decisiones que quedan abiertas

- **Quién paga la llamada.** Cada informe es una llamada a la API. Con muchos
  profesionales conviene definir si hay tope por cuenta.
- **Si el informe se guarda.** Hoy `ai_reports` existe. Guardar el texto
  generado es cómodo, pero es dato clínico que queda en la base con todo lo
  que eso implica en la Ley 25.326.
- **Encuadre regulatorio.** Un texto que interpreta y sugiere conducta empuja
  hacia software de apoyo a la decisión clínica, con exigencias distintas
  según jurisdicción. Vos tenés mapeada la exposición en cinco países.
