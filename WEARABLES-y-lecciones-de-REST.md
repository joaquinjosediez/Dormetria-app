# Wearables, y qué copiar de REST

Dos cosas distintas que conviene no mezclar: **hasta dónde se puede llegar con
los datos del reloj** (sección 1 y 2), y **qué de REST vale la pena imitar**
(sección 3 y 4). Al 22-sep-2026.

---

## 1. Lo primero: REST no demuestra lo que parece demostrar

Lo estás leyendo como prueba de que se puede tener todo junto —wearables,
programa, IA, clínicos— sin problema regulatorio. Mirá las dos pantallas
juntas:

**Pantalla de onboarding:**

> "Rest es solo para el bienestar general y la educación. Rest **no puede
> diagnosticar, curar, mitigar, tratar ni prevenir** ninguna enfermedad o
> condición de salud."

**Panel de clínicos, tres pantallas después:**

> "Sleep window — **Patient's prescribed sleep window**. Ideal wake time.
> Earliest bedtime."

Eso es **restricción del tiempo en cama**, el ingrediente activo de la TCC-I,
con la palabra *prescribed* escrita por ellos. Y en la app del paciente está,
pero con otros nombres: *"Desbloquea tu hora de despertarse"* es el cálculo de
la ventana, y *"Asociación cama-sueño"* es control de estímulos.

REST no resolvió el problema regulatorio. **Le puso otro nombre.**

Y hay una razón por la que eso no alcanza, que está en la misma guía de ANMAT
que leímos la semana pasada:

> "Los **materiales de ventas y marketing** pueden considerarse como
> 'información proporcionada por el fabricante' y, por lo tanto, reflejar la
> **intención objetiva** del fabricante."
> — ANMAT-PME-SOF 001-00, punto 5.5.1

Lo que dice el uso previsto de una app no es lo que dice su pantalla de
descargo: es lo que dice **todo junto**, incluido el paywall. Y el paywall de
REST dice:

> "Desbloquea coaching personalizado para **arreglar tu sueño** más rápido."
> "Suscriptores reducen 50% el tiempo despiertos*"
> US$ 49,99 por mes.

Con el asterisco aclarando: *"Tiempo para dormirse: 52% menos. Tiempo
despierto por la noche 49% menos. Promedio de **318 suscriptores que
completaron** 8 semanas de Rest. Whitepaper Sleep Outcomes, 2026."*

Como médico del sueño ya viste el problema: **análisis solo de completadores,
sin grupo control, en un whitepaper propio.** No sabemos cuántos empezaron,
quiénes abandonaron ni qué hubiera pasado sin la app. Es una cifra de
marketing presentada como resultado clínico. Y la guía 1.4.1 de Apple dice
textualmente que las afirmaciones de exactitud sobre mediciones de salud
tienen que estar respaldadas por datos y metodología, o rechazan la app.

**Conclusión, y es lo contrario de lo que sugiere la primera impresión:** REST
no es un modelo a copiar en lo regulatorio. Es la ilustración exacta del
riesgo que te describí en el uso previsto: un descargo que no coincide con el
producto no protege a nadie, porque el regulador lee las dos pantallas.

Lo que sí es excelente en REST es el **diseño de la experiencia**. Eso sí hay
que robarlo, y con ganas. Sección 3.

---

## 2. Los wearables: dónde está la línea

### 2.1 Corrijo lo que te dije

En el uso previsto puse "bloquear la importación de señales o wearables" como
regla dura. Estaba mal, o al menos era demasiado gruesa. La aclaración de
ANMAT al criterio 1 dice:

> "El software que adquiere imágenes y datos de dispositivos médicos
> **únicamente con el propósito de mostrar, almacenar, transferir o
> formatear** se conoce comúnmente como Sistemas de datos de dispositivos
> médicos (MDDS) y **no califica como un dispositivo médico**."

La línea no está en *importar*. Está en *analizar*.

| Se puede | No se puede |
|---|---|
| Traer de Apple Health o Health Connect los valores **ya derivados** por el reloj (hora de dormir, hora de despertar, minutos despierto) para **precargar** el campo | Traer la señal cruda (PPG, SpO₂, acelerometría) y calcular algo con ella |
| Mostrarlo con la procedencia a la vista y dejar que la persona lo **confirme o corrija** antes de guardar | Que el dato del reloj entre al motor sin que nadie lo haya confirmado |
| Registrar que **el reloj le notificó** posible apnea, como un dato que la persona reporta | Derivar nada de la oximetría. ANMAT nombra la detección de apnea como ejemplo de SaMD |
| Guardar y mostrar el histórico | Usar los estadios (REM, profundo, ligero) para cualquier afirmación clínica |

REST hace exactamente lo primero, y no es casualidad: el campo dice
*"Autocompletado por Apple Watch de Joaquin"*, sigue siendo editable, y antes
de guardar hay una pantalla **"Revisa tu entrada"** donde cada campo se puede
tocar y los autocompletados están marcados. Ese diseño no es comodidad: es la
diferencia entre precargar y medir.

### 2.2 Un cambio que sí te conviene mirar

**[Seguro]** Desde septiembre de 2024 la **notificación de apnea del sueño del
Apple Watch tiene autorización de la FDA** (estudio de 1.448 participantes,
con IAH desde <5 hasta ≥30). Samsung tiene la suya desde febrero de 2024, y
la extendió al Galaxy Ring. Al día de hoy hay tres funciones de consumo
autorizadas para tamizaje de apnea.

Esto abre una puerta limpia: si **el reloj** —que es un dispositivo con
autorización propia— emite la notificación, y Dormetria solo **registra que la
persona la recibió**, Dormetria está mostrando la salida de un dispositivo
regulado de terceros, no computando nada. Un campo del diario:

> *"¿Tu reloj te notificó una posible apnea del sueño?"* · Sí / No / No tengo
> esa función

Eso es información aportada por la persona sobre un dispositivo regulado. Es
más defendible que cualquier cosa que Dormetria calcule, y clínicamente es
útil: entra como un dato más junto al STOP-BANG.

### 2.3 La parte clínica, que me importa más que la regulatoria

Acá te hablo como si discutiéramos un paciente, no una norma.

**Los wearables de consumo sobreestiman el TST y subestiman el WASO.** Es el
sesgo conocido de la actigrafía llevado al extremo: el algoritmo asume sueño
cuando no hay movimiento, y alguien acostado quieto y despierto —que es
literalmente el insomne— queda clasificado como dormido.

En insomnio eso es exactamente al revés de lo que necesitás. **[Probable]** La
validación del staging de Samsung contra PSG da 71,6% de exactitud balanceada
y kappa 0,56 para cuatro estadios. Para un panel de tendencia está bien. Para
alimentar tu correlación de *percibido vs medido* —que es de lo mejor que
tiene Dormetria— sería veneno: el "medido" pasaría a tener un sesgo
sistemático en la misma dirección que querés detectar, y el panel diría que el
paciente "sobreestima su insomnio" cuando en realidad el reloj lo subestima.

Si importás wearables, **ese panel tiene que seguir corriendo sobre el dato
que la persona confirmó**, no sobre el del reloj. Si no, te quedás con un
artefacto con cara de hallazgo.

**Ortosomnia.** El término es de Baron y col. (2017, *J Clin Sleep Med*):
pacientes cuyo insomnio empeora por la fijación con los datos del tracker.
Persiguen el número de sueño profundo, se angustian con el informe de la
mañana, y el resultado es más hiperactivación en la cama. Es el mecanismo
perpetuante del modelo de las 3 P, alimentado por el dispositivo.

La combinación restricción de sueño + reloj que informa "42 minutos de sueño
profundo" es mala. Si vas a importar, **el reloj tiene que ser un asistente de
tipeo, no una fuente de verdad que el paciente consulte**. Concretamente:

- El reloj **precarga** el diario. No genera su propia pantalla de resultados.
- Dormetria **no muestra estadios de sueño**. Ni aunque el dato esté ahí.
- La persona ve **su** número —el que confirmó— y no una comparación
  "vos dijiste 6 h, tu reloj dice 7 h 20". Esa pantalla es una fábrica de
  ortosomnia.

### 2.4 Lo que sí ganás, que es mucho

Todo lo de arriba es cautela, y conviene terminar con lo otro: **el problema
real que tenés es de adherencia, y esto lo ataca de frente.** El diario se
completa a la mañana, medio dormido, y hay siete campos. Que cuatro vengan ya
puestos y haya que confirmarlos es la diferencia entre completarlo y no.

Es la razón por la que REST lo hizo, y es buena razón.

---

## 3. Qué copiar de REST

Ordenado por relación valor/trabajo, no por orden de pantalla.

### 3.1 Puntuar el registro, no el sueño

Lo mejor que vi de todo. REST muestra **"Puntuación de consistencia: 100"** —
y lo que puntúa es haber completado el registro, no cómo durmió.

Vos tenés hoy un **"Score de sueño: 69 · Regular"**. Pensá en qué le dice eso
a una persona con insomnio a las 7 de la mañana: le pone una nota a algo que
no eligió. Es como calificar la fiebre.

La consistencia, en cambio, es lo único que el paciente **sí controla**, y es
además la variable de la que depende todo el tratamiento: sin diario no hay
ventana, no hay ajuste, no hay nada. Es el blanco correcto para el refuerzo.

No hay que sacar el score de sueño —es información clínica y va— pero el
número grande de la pantalla de inicio debería ser el de consistencia.

### 3.2 Los puntos sólidos, y por qué tenés razón

Dijiste que preferís los puntos que se rellenan a la racha. Coincido, y el
motivo es mejor que estético.

Una **racha** enmarca la pérdida: se rompe, vuelve a cero, y el castigo es
desproporcionado respecto a haber faltado una mañana. En un diario de sueño
eso tiene una consecuencia que no tiene en Duolingo: **crea un incentivo para
completar hacia atrás una noche que no se recuerda**. O sea, para inventar
datos. Vos ya tenés noches marcadas como "a revisar"; esto las multiplicaría.

Los **puntos** muestran exactamente la misma información —cuántos días
registró esta semana— sin el marco de pérdida y sin el incentivo perverso. Un
hueco es un hueco, no un fracaso.

### 3.3 "¿Necesitás ayuda para completar esto?" en cada pregunta

En cada pantalla del diario, REST pone un desplegable amarillo con la
definición **y un ejemplo trabajado**. El de WASO es el que más importa:

> "Por ejemplo, si te dormiste a las 10:00 p.m. y te despertaste una vez
> durante 60 minutos, y luego te despertaste a las 4:00 a.m. y ya no volviste
> a dormirte, aquí debería ser 60 minutos."

Ese es el campo más difícil de todo el diario y del que depende tu eficiencia,
tu vigilia intrasueño y media orientación clínica. Hoy Dormetria tiene el
rótulo; no tiene el ejemplo.

**Es puro texto y es de lo que más mejora la calidad del dato.** Lo pondría
esta semana.

### 3.4 "Revisá tu entrada" antes de guardar

Pantalla final con todos los campos, cada uno tocable para corregir, y los
autocompletados marcados con su origen. Dos funciones a la vez:

- **Clínica**: agarra los errores de carga antes de que entren. Vos tenés todo
  un bloque de "noches a revisar" que existe porque el dato malo ya entró.
- **Regulatoria**: es la confirmación explícita que convierte el dato del reloj
  en dato aportado por la persona. Si importás wearables, esta pantalla deja
  de ser opcional.

### 3.5 Desbloqueo progresivo en vez de muro

REST dice **"Registra para desbloquear"**, *"Log your sleep at least 3 days
this week"*, *"Disponible en 6 días"*. Muestra el gráfico borroso con un
candado.

Dormetria tiene exactamente el mismo requisito —hacen falta 3 noches para
calcular— pero lo dice como un muro: *"Necesitás al menos 3 registros en el
diario para calcular tu score"*. Mismo requisito, marco opuesto: uno es una
puerta cerrada, el otro es una meta a seis días.

Cambio de copy y un gráfico difuminado. Barato y cambia el tono de toda la
primera semana.

### 3.6 El plan del día 1: armar el hábito, no usar la app

La primera pantalla después del alta no pide datos. Pide tres cosas:

- Elegí algo que hagas cada mañana, como tomar café o ducharte
- Escribí una nota que diga "Registrar sueño" y pegala cerca de donde lo hacés
- Mové el ícono de la app a la pantalla de inicio de tu teléfono

Eso es **habit stacking** e intenciones de implementación, bien aplicado: no
le piden que "se acuerde", le piden que ate la conducta nueva a una existente
y que modifique el entorno. Es la intervención de adherencia más barata que
existe y es solo texto.

Vos venías dando vueltas con el WhatsApp para adherencia. Esto es gratis, no
necesita línea, no necesita proveedor, y probablemente rinda parecido.

### 3.7 El enlace al profesional, que caduca

**"Rest for Clinicians"**: el paciente genera un enlace, se lo manda a su
médico por mensaje o mail, el médico lo abre **sin crear cuenta** y ve las
métricas. *"Este enlace caduca en 14 días."*

Esto resuelve un problema que vos tenés medido: colegas que dan de alta
pacientes que nunca entran, y pacientes cuyo médico nunca mira el panel. Acá
la iniciativa es del paciente y el clínico no tiene fricción de registro.

**Pero ojo, para Dormetria no es igual de simple.** Ese enlace lleva datos
clínicos de un paciente identificable. Si se implementa:

- Token aleatorio largo, no un id adivinable, y no el correo en la URL.
- Vencimiento real del lado del servidor, no solo en el texto.
- El paciente tiene que poder **revocarlo** antes del vencimiento.
- Solo lectura, y solo las métricas: nada de notas del profesional ni de
  escalas de salud mental sin que lo decida explícitamente.
- Queda registrado cuándo se abrió y desde dónde.

Con eso es una buena idea. Sin eso es una filtración con interfaz linda.

### 3.8 Detalles menores que valen

- **Procedencia por campo** ("Autocompletado por Apple Watch de Joaquín").
  Obligatorio si importás, y además es honesto.
- **Resumen de una línea de la noche** ("Gran noche. Te dormiste rápido y
  dormiste toda la noche sin siestas"). Humaniza el número.
- **La (i) en cada tarjeta de métrica**. Vos ya tenés el "¿Cómo se calcula
  este score?"; extenderlo a cada métrica sirve para el criterio 4 de ANMAT,
  que pide que el usuario pueda revisar la base de lo que ve.
- **Biblioteca de herramientas** (sonidos, meditaciones, relatos). No es
  tratamiento, es adherencia y retención. Es contenido, no código.

---

## 4. Qué NO copiar

**La declaración de bienestar mientras se hace TCC-I.** Sección 1. Es
justamente el riesgo, no la solución.

**La cifra de eficacia.** "50% menos tiempo despierto" sobre 318
completadores, sin control, en whitepaper propio. Si Dormetria publica un
número así, lo publica con un diseño que lo sostenga o no lo publica. Vos vas
a tener el dato real del piloto; esa es una ventaja sobre ellos, no la tires
poniéndole el mismo marco de marketing.

**La IA como núcleo del producto.** "Rest funciona con IA... contenido
destinado únicamente a fines educativos" y, dos pantallas después, "Coach de
sueño AI 24/7" y "Coaching diario para cambiar hábitos" por US$ 49,99. La
diferencia de Dormetria es que hay un profesional matriculado del otro lado.
Reemplazarlo por un LLM regala el diferencial y compra el pasivo.

**Una pregunta por pantalla en el diario diario.** Para el onboarding está
bien: se hace una vez y reduce el agobio. Para algo que se completa **todas
las mañanas durante ocho semanas**, ocho pantallas es fricción. El formulario
único de Dormetria puede ser mejor acá. No lo copiaría sin medirlo.

**Las capturas de "Factores" con las fotos y el aviso de SnoreGym** son de
otra app, SnoreLab, no de REST. La idea del ícono con explicación al mantener
apretado es buena y tus variables personalizadas ya hacen algo parecido —lo
que les falta es el *porqué*: "el ejercicio intenso puede afectar tu sueño,
marcalo para comprobar si te afecta". Eso sí lo tomaría. La publicidad de otra
app adentro de una herramienta clínica, no.

---

## 5. Lo que propongo hacer, en orden

| # | Qué | Trabajo | Depende de |
|---|---|---|---|
| 1 | Ejemplo trabajado en cada pregunta del diario, sobre todo WASO | bajo | nada |
| 2 | Puntuación de consistencia como número principal del inicio | bajo | nada |
| 3 | Puntos sólidos por día de la semana, sin racha | bajo | nada |
| 4 | Desbloqueo progresivo en vez de muro de 3 noches | bajo | nada |
| 5 | Plan del día 1 con habit stacking | bajo | nada |
| 6 | Pantalla "Revisá tu entrada" antes de guardar | medio | nada |
| 7 | (i) con la fuente en cada métrica | medio | ya estaba en el uso previsto |
| 8 | Enlace al profesional, con token y vencimiento | medio | decisión tuya sobre alcance |
| 9 | Importación desde Apple Health / Health Connect | alto | ser app nativa |
| 10 | Campo "¿tu reloj te notificó apnea?" | bajo | nada |

Los 1 a 6 y el 10 no necesitan que Dormetria sea una app nativa: se pueden
hacer sobre la PWA de hoy. El 9 sí espera a las tiendas.

**Decime si arranco por el 1 al 5**, que son todos de la misma tarde, y
seguimos con el resto según lo que decidas sobre el programa.

---

## Fuentes

- [ANMAT · Guía SaMD/MLMD (ANMAT-PME-SOF 001-00)](https://opinionpublica.anmat.gob.ar/proyectos/5293.pdf)
- [ANMAT · Disposición 64/2025](https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-64-2025-408309/texto)
- [Apple · App Review Guidelines (1.4.1)](https://developer.apple.com/app-store/review/guidelines/)
- [Apple · Nuevas funciones de salud, incluida la notificación de apnea](https://www.apple.com/newsroom/2024/09/apple-introduces-groundbreaking-health-features/)
- [FDA autoriza la notificación de apnea del Apple Watch](https://www.pulmonologyadvisor.com/news/fda-clears-apples-sleep-apnea-notification-feature/)
- [Validación del smartwatch Samsung para determinación sueño-vigilia y estadios](https://www.e-jsm.org/journal/view.php?doi=10.13078%2Fjsm.230004)
- [REST · sitio del producto](https://getrest.app/es/)
