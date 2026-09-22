# Tres respuestas: cribado, uso ocupacional y datos de la EEDSI

Al 22-sep-2026. Sigo sin ser abogado ni consultor regulatorio.

---

## 1. El cribado no cambia el encuadre. Y el mejor ejemplo del mundo lo probó

Tu pregunta tiene una premisa adentro: que si la app detecta y bloquea a las
poblaciones de riesgo, la restricción de sueño deja de ser un problema
regulatorio. **Eso mezcla dos cosas distintas: el riesgo y el uso previsto.**

Cribar contraindicaciones **reduce el riesgo**. No cambia lo que la app hace.
Si un software calcula una ventana de sueño con los datos de una persona y se
la prescribe durante ocho semanas, está tratando — cribe o no cribe. El
cribado es una **medida de control de riesgo**, que es justamente lo que la
norma ISO 14971 te va a exigir *después* de aceptar que es un dispositivo. Es
lo que hacés una vez adentro, no la puerta para no entrar.

Dicho de otro modo: un tensiómetro con una advertencia de uso no deja de ser
un tensiómetro.

### Lo que hizo Big Health, que es la prueba concluyente

**[Seguro]** Sleepio es el programa de TCC-I digital con mejor evidencia que
existe. Big Health, que lo desarrolló, tiene recursos, ensayos y abogados. Y
esto es lo que hicieron:

| Producto | Qué es | Cómo se accede |
|---|---|---|
| **Sleepio** | versión de bienestar | Se vende a empleadores y aseguradoras, sin receta |
| **SleepioRx** | dispositivo médico con autorización de la **FDA** (8-ago-2024) | **Con receta** de un profesional, tratamiento de 90 días |

**Es el mismo contenido de TCC-I.** No intentaron cribar su camino hacia
afuera de la regulación: partieron el producto en dos, uno de cada lado de la
línea. Con la mejor evidencia clínica del rubro en la mano.

Eso es exactamente lo que te propuse en el uso previsto —vía de bienestar
libre, protocolo con restricción activado por un profesional— y ahora lo
podés citar como el estándar del sector en vez de como una idea mía.

### Cómo lo resuelve REST: no lo resuelve

Ya lo vimos en las capturas. Declaran bienestar en el onboarding y su panel
de clínicos dice *"Patient's **prescribed** sleep window"*. Le cambiaron el
nombre. No es una solución, es una apuesta.

### Para qué sirve igual el cribado que proponés

Para mucho, y hay que hacerlo — solo que por otro motivo. Si la vía libre
queda sin restricción, el cribado sigue siendo necesario para decidir **qué
se le ofrece a quién**:

- **Bandera de apnea (STOP-BANG ≥3)** → la vía libre sigue disponible, pero
  antes aparece que conviene evaluar apnea.
- **Trabajo en turnos, conducción profesional** → la vía libre sigue
  disponible; el protocolo con restricción no se ofrece sin profesional.
- **Antecedente de manía, epilepsia, embarazo, menor de 18** → el protocolo
  con restricción no se ofrece, punto.
- **PHQ-9 ≥20 o ítem 9 positivo** → antes que cualquier programa, la
  sugerencia de consultar.

Ese cuestionario de seguridad hay que escribirlo igual. Cambia a quién se le
ofrece qué, no si Dormetria es un dispositivo.

---

## 2. Lo ocupacional: Somni no es una app de sueño

Miré Somni. **[Probable]** Es un sistema de **gestión de fatiga**, no de
salud del sueño, y esa diferencia es toda la respuesta a tu pregunta.

Lo que hace: una prueba cognitiva de psicovigilancia antes de entrar al turno
más un modelo predictivo, y devuelve si la persona está por debajo del límite
de fatiga permitido. Si detecta una anomalía, **avisa al supervisor**.

Somni puede avisarle al supervisor porque lo que manda es **"apto / revisar
antes de operar" del día de hoy**, no un dato clínico. Funciona como un
alcoholímetro: mide estado operativo en este momento, no salud. No
diagnostica, no trata, y el empleador no se entera de ninguna condición de
salud de nadie.

**El día que Dormetria le ponga a un minero un diario de sueño, un ISI y un
PHQ-9, y algo de eso llegue al empleador, es otro producto.** Un resultado de
psicovigilancia del día y "esta persona tiene PHQ-9 de 18" no son datos del
mismo tipo, y el segundo no puede salir de la relación médico-paciente.

Ojo además con la comparación: Somni es chilena y allá regula el **ISP**, no
ANMAT, con un marco laboral distinto. Sirve como ejemplo de diseño, no como
precedente legal para Argentina.

### El escalonamiento que sí cierra

Sí, se puede escalonar, y el criterio es **qué tipo de dato cruza cada
frontera**, no cuántos niveles hay:

| Nivel | Quién ve | Qué ve | Qué es |
|---|---|---|---|
| **Trabajador** | él | todo: diario, escalas, programa | su ficha |
| **Médico laboral** | matriculado, con secreto profesional | lo individual, como profesional tratante | acto médico |
| **Empresa** | RR.HH. / prevención | **solo agregados**, con N mínimo | estadística |

Y la regla que hace que funcione: **de la columna del trabajador a la de la
empresa nunca cruza un dato individual.** Ni un actograma, ni un puntaje, ni
un nombre. Es lo mismo que ya hiciste con el panel de administrador cuando
dijiste *"quiero ver las estadísticas, no los datos de pacientes que no son
míos"*. Allá fue una preferencia tuya; acá es obligatorio.

**Lo que sigo recomendando:** esto va como **producto aparte**, con su propio
uso previsto, después de publicar el primero. No porque no sirva —es donde
está la plata— sino porque, declarado dentro del mismo uso previsto, sube la
situación de salud a "crítica" (un operador de mina con apnea no tratada lo
es) y arrastra la clasificación del producto entero. La regla de ANMAT es
explícita: **si el uso previsto declara varias situaciones, se clasifica por
la más alta.**

Si querés entrar antes al mercado ocupacional, el camino de Big Health está a
la vista: **la vía de bienestar se vende a empleadores.** Eso es lo que hace
Sleepio. Bienestar del sueño para la dotación, agregados para la empresa, y
cero datos clínicos individuales cruzando.

---

## 3. La EEDSI: dónde quedan y dónde se analizan los datos

### Dónde quedan

Mi recomendación **[Suposición]**: en un **proyecto de Supabase separado**,
no en una tabla aparte del mismo proyecto. Cuatro motivos, en orden de peso:

1. **Un error de policy no puede cruzar la frontera.** Si el estudio vive en
   la misma base que las fichas, un RLS mal escrito comunica las dos
   cohortes. Con proyectos separados, el error más tonto no alcanza para
   filtrar pacientes.
2. **El comité pregunta esto.** "¿Dónde viven los datos del estudio?" se
   responde muchísimo mejor con *"en una base que no contiene ninguna ficha
   clínica"*.
3. **Un pedido de borrado del estudio no toca la base asistencial.**
4. **Un co-investigador puede entrar al estudio sin entrar a los pacientes.**

La tabla ya está diseñada en `EEDSI-ruta-de-validacion.md`: sin correo, sin
nombre, sin `patient_id`; seudónimo aleatorio; `check` que hace **imposible**
guardar una respuesta sin consentimiento; y **ninguna policy de SELECT**, que
con RLS activo significa que nadie que use la clave pública puede leer nada.

Y la regla de la ruta web: **si hay sesión abierta, no la lee.** Si un
paciente del piloto escanea el QR, entra como participante anónimo igual. Sin
eso, el `patient_email` se cuela por la puerta de atrás.

### Dónde se analizan

**Fuera de la app y fuera de cualquier IA.** Concretamente:

- Exportación desde el panel de Supabase con `service_role` → CSV.
- Análisis en R o Python, en tu máquina o en un entorno controlado.
- **Nada de mandar respuestas del estudio a una API de IA.** Eso es una
  transferencia a un tercero en otro país, tiene que estar en el
  consentimiento, y el consentimiento aprobado casi seguro no lo dice.
- El código del análisis, versionado. Para una validación de instrumento eso
  no es prolijidad: es lo que hace el resultado reproducible.

### Y algo que conviene chequear, que vale para toda la app

**[Suposición — verificalo con el abogado, no me hagas caso a mí]** La Ley
25.326 restringe la **transferencia internacional** de datos personales a
países sin nivel adecuado de protección (art. 12). Tu proyecto de Supabase
está alojado en algún lado, probablemente Estados Unidos.

Si eso aplica, **no es un problema de la EEDSI: es un problema de toda
Dormetria**, porque los diarios y las escalas de tus pacientes están ahí
mismo. Hay salidas conocidas —cláusulas contractuales, consentimiento
informado explícito, o elegir región— pero es una pregunta que conviene hacer
ahora y no cuando haya mil pacientes.

Decime en qué región está el proyecto y lo miro con más precisión.

---

## 4. Lo que ya está hecho, de lo que pediste

**En producción (mod208):**

- **Sacada la sugerencia de fármaco.** El campo decía "Solo como puente, ≤ 4
  semanas". En su lugar queda la referencia de la guía (AASM 2021 · ESRS
  2023), que es información publicada y no una indicación para este paciente.
- **Banderas reescritas como cotejo, no como detección.** "Apnea probable" →
  "STOP-BANG sobre el punto de corte · 5/8 · Punto de corte ≥3 (Chung et
  al.)", con el detalle diciendo que el cuestionario estima riesgo y que
  confirmar apnea requiere un estudio.
- **La de somnolencia al volante**, que era la más delicada: ya no indica
  evaluar restricciones de conducción. Dice que conviene conversar cómo
  afecta a las actividades que requieren atención sostenida, incluida la
  conducción. Misma información clínica, sin dirigir una conducta de corto
  plazo.
- **Cada bandera muestra ahora su umbral con la cita.** Es el criterio 4 de
  ANMAT: el usuario tiene que poder revisar la base de lo que ve.
- **Los matices** ("evitar hipnóticos miorrelajantes") pasaron a ser lo que
  dicen las guías, no instrucciones.
- **El informe de Ruffa.** Ver abajo.

**En staging (stg209):** los seis puntos de adherencia. Detalle en la
sección 5.

---

## 5. El informe de Ruffa, y por qué el arreglo anterior no alcanzó

Lo que le aparece ahora **no es el error de antes**. El *prefill* está
resuelto: la función de Supabase responde bien. El problema es de este lado.

La función devuelve el JSON del modelo dentro del campo `texto` cuando ella
misma no logra parsearlo, y `dmLeerEstructura` era estricta: exigía que el
primer carácter fuera `{`. Cuando fallaba, el render caía al modo "texto
plano en párrafos" y **le mostraba el JSON crudo al profesional**. Llaves,
comillas y todo. Es el peor final posible: parece que la app se rompió y el
contenido clínico está ahí, ilegible.

Tres cosas rompen ese parseo y las tres son del modelo:

1. Envuelve la respuesta en un bloque ` ```json ... ``` `
2. Antepone una línea de cortesía ("Aquí está el informe:")
3. **Se queda sin tokens y corta el JSON por la mitad** — que mirando tu
   captura es lo que pasó: el texto termina en `]` y no sigue

Ahora las tres se recuperan: se sacan los cercos, se busca desde la primera
llave hasta la última, y si quedó truncado se cierran las llaves y corchetes
abiertos retrocediendo hasta el último ítem completo. Si cortó adentro de un
string, **devuelve null en vez de adivinar** — prefiero no mostrar nada antes
que mostrar un informe inventado.

Y si de todas formas no se puede reparar, ya no se le vuelca el JSON: dice
*"El informe llegó incompleto"*, ofrece **Rehacer**, y deja el crudo detrás de
un desplegable por si hace falta para diagnosticar. Copiar tampoco pega un
JSON en la historia clínica.

Hay una prueba nueva (`33-el-informe-nunca-muestra-json.js`) que corre la
función real contra los tres modos de rotura.

**Lo que igual conviene hacer del lado de Supabase**, porque esto es un
paracaídas y no la solución: subir `max_tokens` de 1500 a 4000. Con un
informe de 21 noches y ocho parámetros, 1500 se queda corto — y eso es
exactamente lo que se ve en tu captura.

---

## 6. Los seis cambios de adherencia, en staging

1. **Ejemplo trabajado en cada pregunta.** Desplegable "¿Necesitás ayuda para
   completar esto?" en latencia, despertares, hora de despertar y hora de
   levantarse. El de despertares es el que más importa: *"te dormiste 22:00,
   te despertaste una vez y tardaste 60 minutos en volver a dormirte, y
   después te despertaste 4:00 y ya no te dormiste más — acá van 60 minutos"*.
   De ese campo dependen tu eficiencia y tu vigilia intrasueño.
2. **Constancia en vez de racha.** El número grande del inicio pasa a ser el
   porcentaje de los últimos 7 días. Es lo único que la persona controla: cómo
   durmió no lo eligió.
3. **Siete puntos, uno por día.** Sin racha. El motivo no es estético: una
   racha crea incentivo para completar hacia atrás una noche que no se
   recuerda, o sea para inventar datos, y en un diario clínico eso es un
   problema de integridad.
4. **Desbloqueo progresivo.** "Necesitás al menos 3 registros" pasó a ser el
   gráfico difuminado con "Llevás 1 de 3 noches. Faltan 2" y una barra. Mismo
   requisito, meta en vez de muro.
5. **Plan del día 1.** Tres ítems de *habit stacking* mientras no haya
   ninguna noche cargada: atar el registro a algo que ya hace, una nota
   pegada, el ícono en la primera pantalla. Se guarda en el dispositivo.
6. **Paso "Revisá tu entrada"** antes de guardar. Cada línea lleva a su paso
   para corregir. Agarra el error antes de que entre —hoy tenés todo un bloque
   de "noches a revisar" porque el dato malo ya entró— y el día que se importe
   del reloj es la confirmación que convierte un dato medido en un dato
   aportado por la persona.

7. **Disposición al cambio, antes de la TCC-I.** Lo que viste en REST, con
   una corrección: van **dos reglas y no una**.

   En entrevista motivacional (Rollnick) *importancia* y *confianza* son
   construcciones distintas y piden intervenciones **opuestas**:

   | Lo que dice el número | Qué significa | Qué hay que hacer |
   |---|---|---|
   | Importancia baja | no sabe para qué lo haría | trabajar el porqué, no el cómo |
   | Confianza baja | quiere, pero no se cree capaz | achicar el primer paso, no insistir con el motivo |

   Un solo deslizador mezcla las dos y pierde justamente lo accionable. Son
   diez segundos más y cambia qué le decís a la persona.

   Va además la pregunta que en entrevista motivacional hace la diferencia:
   **"¿por qué ese número, y no uno más bajo?"**. Es opcional, y es la que
   hace que la persona argumente a favor del cambio en vez de en contra.

   Y el programa ajusta lo que promete según con qué llegó. Ejemplo real de
   lo que implementé, para alguien con importancia y confianza altas:
   *"Llegás con ganas y con confianza. Un aviso, justamente por eso: las
   primeras dos semanas suelen empeorar el cansancio diurno antes de mejorar
   el sueño. Es esperable y es parte del mecanismo."* Eso es exactamente el
   ajuste de expectativas que pediste, y es donde se pierden los pacientes.

   Por ahora se guarda en el dispositivo. Para que vos lo veas hace falta una
   tabla: el SQL está en `SQL-disposicion-al-cambio.md`. Sin `update` ni
   `delete` a propósito — una medición no se corrige, se vuelve a tomar, y lo
   interesante clínicamente no es el valor de entrada sino **si se movió**.
   Cuando corras el SQL agrego la re-toma en la semana 4.

### Una cosa de staging que tenés que saber

**`staging/index.html` apunta al mismo proyecto de Supabase que producción**
(`sojvsbwpqdwjuvezdhby`). `CLAUDE.md` dice que debería usar el proyecto
`dormetria-staging` con datos ficticios, y no lo hace. Además estaba 175
versiones atrás (hoy75-mod32 contra mod207), así que lo refresqué al código
de hoy.

Le puse un cartel rojo fijo que lo dice, para que no se descubra escribiendo.
**Probá con una cuenta demo, no con un paciente real.** Cuando quieras separar
los entornos de verdad, es un rato de trabajo y te lo dejo listo.

---

## Fuentes

- [AASM · La FDA autoriza SleepioRx para insomnio crónico](https://aasm.org/fda-clears-sleepiorx-for-chronic-insomnia/)
- [Big Health · Autorización de la FDA para SleepioRx](https://www.bighealth.com/news/us-fda-grants-clearance-for-sleepiorx)
- [STAT · Big Health obtiene la autorización](https://www.statnews.com/2024/08/08/big-health-sleepio-insomnia-fda-clearance/)
- [SOMNI · Gestión predictiva de fatiga](https://somnicompany.com/)
- [La Tercera · La app chilena que busca prevenir accidentes laborales](https://www.latercera.com/piensa-digital/noticia/startup-chilena-evita-accidentes-laborales-con-inteligencia-artificial/JPVJPUAFBBCLHJP6JVSV6ME2NI/)
- [ANMAT · Guía SaMD/MLMD (ANMAT-PME-SOF 001-00)](https://opinionpublica.anmat.gob.ar/proyectos/5293.pdf)
- [ANMAT · Disposición 64/2025](https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-64-2025-408309/texto)
