# Dormetria · Uso previsto y encuadre regulatorio

Borrador para revisar. Al 22-sep-2026. No soy abogado ni consultor
regulatorio: lo de las secciones 1 a 6 es lectura de la norma publicada y hay
que confirmarlo con alguien que firme. La sección 7 es el documento que
pediste, redactado para que lo puedas llevar a esa consulta.

---

## 1. Antes del encuadre: el directorio pago contamina las banderas rojas

Lo pusiste como un detalle del modelo de negocio —"el médico pagará por
aparecer en el directorio"— y es el punto de mayor riesgo de todo lo que me
describiste. Más que ANMAT.

El problema es de arquitectura, no de intención. En el mismo producto conviven:

1. Un algoritmo que le dice a una persona lega **"esto amerita consulta"**.
2. Una lista de profesionales que **pagaron por estar ahí**.

Eso crea tres problemas a la vez:

**Ético.** La sensibilidad del tamizaje pasa a ser una palanca de ingresos.
Bajar el punto de corte del STOP-BANG de 5 a 3 genera más derivaciones y más
valor para quien paga el directorio. No digo que lo vayas a hacer; digo que la
estructura hace que la pregunta sea legítima, y que un comité de ética o un
periodista la van a hacer.

**Regulatorio.** Debilita justo el criterio de exclusión que más te conviene
(el tercero y el cuarto de la sección 2). Si la alerta empuja al paciente
hacia un profesional específico que paga, cuesta más sostener que el software
"solo apoya" la decisión.

**Deontológico.** En Argentina los códigos de ética médica prohíben pagar o
cobrar por derivación de pacientes. La diferencia entre *publicidad* —el
médico paga por figurar— y *comisión por derivación* —el médico paga y le
llegan pacientes derivados por el algoritmo— es fina, y la define **dónde
aparece el directorio**.

**El arreglo, y es de diseño:**

- La pantalla de bandera roja **no enlaza** al directorio. Dice qué encontró,
  qué significa y que conviene consultar. Punto.
- El directorio es una pestaña aparte, a la que el usuario llega por su
  cuenta, ordenada por especialidad, zona y disponibilidad. **Nunca por pago.**
- Quién paga y qué compra se declara en la app, visible, no en los términos.
- El orden de la lista no se altera por el resultado de ninguna escala.

Con eso el modelo se sostiene: el médico compra visibilidad en un directorio,
como en cualquier guía profesional, y no compra la derivación de una persona
a la que la app acaba de asustar.

---

## 2. El marco: los cuatro criterios de exclusión de ANMAT

**[Seguro]** La **Disposición ANMAT 64/2025** (Boletín Oficial 13-ene-2025,
vigente desde el 21-ene-2025) incorporó al derecho argentino la Resolución
GMC MERCOSUR 25/21 y con ella la definición de SaMD: software con finalidad
médica que cumple su propósito sin ser parte del hardware de un producto
médico. Las aplicaciones móviles que encuadran, encuadran.

**[Probable]** La guía para la industria **ANMAT-PME-SOF 001-00 (SaMD-MLMD)**
—que está en el portal de opinión pública y dice expresamente que está *"en
fase de evaluación y sujeta a modificaciones"*, así que no la trates como
texto firme— define qué queda **afuera**:

> Esta guía no se aplicará a: software para **bienestar (Wellness)**; software
> de gestión administrativa y financiera; software que procesa datos
> demográficos y epidemiológicos **sin propósito clínico diagnóstico o
> terapéutico**; software incorporado en un dispositivo ya regulado.

Y define cuatro criterios de exclusión. **Hay que cumplir los cuatro**, no
alcanza con uno:

| # | Criterio | Qué significa para Dormetria |
|---|---|---|
| **1** | No está destinado a adquirir, procesar o analizar una imagen médica, una señal de un IVD, o un patrón/señal de un sistema de adquisición de señal | Hoy **se cumple**: todo lo que entra lo escribe una persona. La aclaración de este criterio deja pasar la importación desde un wearable **si es solo mostrar, almacenar, transferir o formatear** (régimen MDDS). Se rompe si Dormetria *analiza* la señal: estadios de sueño, oximetría, eventos respiratorios. Ver la corrección del punto 8 en la sección 5. |
| **2** | Está destinado a mostrar, analizar o imprimir información médica del paciente o información médica de referencia (guías, estudios, recomendaciones) | **Se cumple**, y es el criterio que mejor te calza: la aclaración dice textualmente que encaja el software que *"haga coincidir los síntomas del paciente y los resultados de las pruebas con las pautas de tratamiento de mejores prácticas para enfermedades comunes"*. Eso es exactamente ISI, STOP-BANG, PHQ-9 y los rangos NSF. |
| **3** | Solo está destinado a **apoyar** a un profesional, paciente o cuidador no profesional en la toma de decisiones | Se cumple **si informa**, no si conduce. La aclaración es la clave: *"informar"* implica que la información **no desencadena una acción inmediata o de corto plazo**. *"Tratar, diagnosticar o conducir la gestión clínica" no encaja.* |
| **4** | No pretende reemplazar el juicio clínico del profesional | Se cumple si el usuario **puede revisar de forma independiente la base** de lo que el software recomienda. Cálculos simples de uso corriente —"como gráficos en papel, hojas de cálculo o calculadoras"— cumplen. |

Nótese el criterio 3: menciona explícitamente al **"paciente o cuidador no
profesional de la salud"**. O sea que el hecho de que el usuario sea lego
**no** te saca de la exclusión por sí solo. Lo que te saca es *tratar*.

Si algo no encuadra en la exclusión, la clase de riesgo sale de esta matriz
(IMDRF N12, adoptada por ANMAT):

| Situación de salud | Tratamiento o diagnóstico | Dirigir el cuidado clínico | Informar el manejo clínico |
|---|---|---|---|
| **Crítica** | IV | III | II |
| **Seria** | III | II | I |
| **No seria** | II | I | I |

Y una regla que importa para vos: **si el uso previsto declara varias
situaciones de uso, se clasifica por la más alta.** Un solo componente
mal encuadrado arrastra al producto entero.

---

## 3. Dónde cae cada uno de los cinco usos

| Uso | Encuadre probable | Qué lo decide |
|---|---|---|
| 1 · Ayuda diagnóstica para profesionales | **Excluido**, si se corrige un punto | La sugerencia de fármaco |
| 2 · Banderas rojas al usuario lego | **Excluido**, si se cuida la redacción | Que informe y no dispare acción inmediata |
| 3 · TCC-I autoadministrado 7–8 semanas | **NO excluido.** Clase II, quizá III | La restricción de sueño sin clínico |
| 4 · Seguimiento ocupacional | El problema **no es ANMAT** | Ley 25.326 y la relación laboral |
| 5 · Investigación | Fuera, si está bien anonimizado | Anonimizado vs. seudonimizado |

### Uso 1 — Ayuda diagnóstica para profesionales

**[Probable] Encuadra en la exclusión, con una excepción concreta.**

Tu analogía es correcta y es la que usa la propia norma: el ISI y el diario de
sueño no son diagnósticos, son instrumentos. Dormetria los calcula y los
cruza contra puntos de corte publicados. Criterio 2, textual.

**Lo que rompe el encuadre hoy:** la tarjeta **"Conducta sugerida"** con los
campos **"Primera línea"** y **"Fármaco"**. Sugerir un fármaco no es *informar
el manejo clínico*: es *dirigir el cuidado clínico*, que en la matriz es una
columna entera más arriba. Con una condición "seria" eso te pone en Clase II
directamente, y arrastra al producto.

Hay dos salidas y las dos son legítimas:

- **(a) Sacar la sugerencia farmacológica.** La tarjeta pasa a decir qué dice
  la evidencia para ese patrón —"la primera línea para insomnio crónico es
  TCC-I (AASM 2021)"— citando la guía, sin nombrar una molécula ni una dosis
  para *este* paciente. Eso es mostrar información de referencia: criterio 2.
- **(b) Dejarla y registrar el producto.** Es defendible, cuesta plata y
  tiempo, y hay que hacerlo antes de comercializar.

**Mi lectura [Suposición]:** (a). La sugerencia de fármaco es lo que menos
aporta de todo el Resumen —el psiquiatra que la lee ya sabe— y es lo que más
te cuesta regulatoriamente. Mala relación.

**Lo que además hay que hacer para el criterio 4:** que cada punto de corte
muestre su fuente en pantalla, no solo en el código. ISI ≥8 (Morin 2011),
STOP-BANG ≥3, PHQ-9 10/15/20, NSF 2015 para los rangos pediátricos. El
criterio pide que el usuario pueda *"revisar de forma independiente la base de
las recomendaciones"*. Hoy muestra la cifra, no la referencia. Es el mismo
trabajo que pide la guía 1.4.1 de Apple: se hace una vez y sirve para las dos.

### Uso 2 — Banderas rojas y sugerencia de consultar

**[Probable] Encuadra, y la redacción es el objeto regulado.**

El criterio 3 incluye expresamente al paciente lego, así que decirle "esto
amerita una consulta" es apoyar una decisión, no tratar. Bien.

Dos cuidados:

**El verbo.** "Apnea probable" se lee como detección. *"Tus respuestas dan 5
de 8 en el STOP-BANG; a partir de 3 la guía recomienda consultar por un
estudio de sueño"* se lee como lo que es: cotejo contra una referencia
publicada. Es la misma información y el segundo es el que encuadra.

**La acción inmediata.** La aclaración dice que *informar* implica que la
información **no desencadena una acción inmediata o de corto plazo**. La
bandera de **somnolencia al volante (Epworth ≥13)** es justamente eso: si dice
"no manejes", está dirigiendo una conducta de corto plazo. Redactala como
riesgo a evaluar con un profesional, no como una indicación. Y no la saques:
es la bandera que más importa.

### Uso 3 — El programa TCC-I autoadministrado

**[Probable] Esto no encuadra, y es la decisión de fondo de todo el producto.**

La aclaración del criterio 3 es explícita: *"El software que se utiliza para
tratar, diagnosticar o conducir la gestión clínica generalmente no encaja bajo
este criterio."* Un protocolo estructurado de siete semanas que le prescribe a
una persona con insomnio una ventana de sueño calculada con sus propios datos
**es tratamiento**. No informa el manejo: lo conduce.

Y no es un tecnicismo. La restricción de sueño tiene efectos adversos reales
—somnolencia diurna, más riesgo al volante, baja del umbral convulsivo en
epilepsia, viraje maníaco en bipolaridad— y por eso la app ya tiene la
advertencia al pie de cada semana. Esa advertencia es la prueba de que sabés
que es una intervención, no contenido educativo.

Clasificación probable: tratamiento de una condición **no seria** → **Clase
II**. Si el usuario es un trabajador de guardia o conduce —uso 4— la
condición pasa a **seria** y va a **Clase III**.

**Hay una tercera vía, y creo que es la buena.** La exclusión de *"software
para bienestar (Wellness)"* deja fuera de la guía a todo un tipo de producto.
Se puede partir el programa en dos:

| Vía | Contenido | Quién la activa | Encuadre |
|---|---|---|---|
| **Bienestar del sueño** | Psicoeducación, regularidad de horarios, luz de la mañana, higiene, control de estímulos, relajación, prevención de recaídas | El usuario, solo | **Wellness** — fuera de la guía |
| **Protocolo TCC-I** | Todo lo anterior **más restricción del tiempo en cama y ajuste de ventana** | Un profesional, para un paciente suyo | Bajo supervisión profesional |

La restricción de sueño es el ingrediente activo de la TCC-I y es también lo
único que tiene efectos adversos propios. Sacarla de la vía autoadministrada
no vacía el programa: deja seis de los siete componentes, que es más de lo
que la mayoría de los pacientes hace hoy. Y no exige código nuevo: la app
**ya** tiene la ventana como algo que el profesional fija y guarda
(`saveCbtiWindow`). Es correr un límite que ya existe.

El costo hay que decirlo: llamarlo TCC-I sin restricción sería incorrecto, y
por eso la vía libre no debería llamarse TCC-I. De ahí el nombre "programa de
bienestar del sueño", que además es el que te deja adentro de la exclusión.

**Esto no lo puedo decidir yo.** Si querés la TCC-I completa
autoadministrada, es un producto legítimo —existen y están aprobados en otros
países— pero es un dispositivo médico y hay que registrarlo. Si querés
salir rápido y sin registro, es la vía partida.

### Uso 4 — Ámbito ocupacional

**Acá el problema no es ANMAT. Es la Ley 25.326 y la relación de
dependencia**, y a mi juicio es la exposición legal más grande de las cinco.

**[Seguro]** Los datos de salud son **datos sensibles** (Ley 25.326, art. 2 y
7). Su tratamiento exige consentimiento **libre, expreso e informado**.

**[Probable]** En una relación laboral el consentimiento **no es libre por
definición**: hay asimetría de poder y el trabajador no puede negarse sin
costo. Es doctrina asentada en protección de datos. Un "acepto" firmado en la
inducción de una minera no resuelve nada.

Y hay un segundo problema: si el empleador recibe un resultado individual y
toma decisiones con él —cambio de turno, apartamiento de tarea, desvinculación
— eso es **aptitud laboral**, que es un acto médico regulado, y expone a
discriminación.

**La arquitectura que sí se sostiene**, y es la que ya aplicaste vos mismo en
el panel de administrador:

- El trabajador ve **su** resultado completo.
- El **médico laboral** —matriculado, con secreto profesional— ve el
  individual, en su rol de profesional tratante.
- El **empleador** ve **solo agregados anonimizados**, con piso mínimo de N
  para que nadie sea identificable por resta. Nunca actogramas, nunca fichas.
- La participación es **voluntaria y revocable**, y no participar no tiene
  consecuencia laboral, por escrito.

Tenés el instinto correcto: cuando armamos las estadísticas de admin dijiste
*"quiero ver las estadísticas, no los datos de pacientes que no son míos"*. Es
el mismo principio, y acá es obligatorio, no una preferencia.

Además, este uso **sube la clase de riesgo de todo el producto**: un operador
de mina o un conductor con apnea no tratada es una situación **crítica**. En
la matriz, informar el manejo clínico en situación crítica ya es **Clase II**.

**[Suposición] Mi recomendación:** dejá el uso ocupacional **fuera del uso
previsto de la primera versión**. No porque no sirva —sirve, y es donde está
la plata— sino porque arrastra la clasificación del producto entero y abre un
frente de derecho laboral que no tiene nada que ver con el resto. Va como
producto aparte, con su propio encuadre, cuando el primero esté publicado.

### Uso 5 — Investigación

**[Seguro]** Si el dato está **anonimizado de forma irreversible**, deja de ser
dato personal y queda fuera de la 25.326.

**[Seguro]** Si está **seudonimizado** —que es lo que definimos para la EEDSI,
con código aleatorio para poder atender un pedido de borrado— **sigue siendo
dato personal**. Son cosas distintas y conviene no llamarlas igual.

Tres condiciones, no negociables:

1. **Consentimiento separado.** No se puede meter dentro de "acepto los
   términos y condiciones". Es un opt-in propio, revocable, y negarse no puede
   limitar el uso de la app.
2. **Comité de ética independiente.** Ya lo tenés en marcha para la EEDSI. Es
   además requisito de la **guía 5.1.3 de Apple**, que puede pedirte la
   aprobación.
3. **La ruta de investigación, fuera de la app publicada.** Si el QR de la
   EEDSI vive dentro de la app de la tienda, el protocolo pasa a ser requisito
   de tienda. Mantenela como ruta web aparte, que es como quedó diseñada.

---

## 4. Uso previsto · DORMETRIA

*Versión 1.0 — borrador. Redactado según IMDRF/GRRP WG/N52 (etiquetado e
instrucciones de uso) y el punto 8.2 de la guía ANMAT-PME-SOF 001-00, que pide
"finalidad de uso; usuario previsto; indicación de uso; ambiente de uso;
contraindicaciones".*

### 4.1 Finalidad de uso

Dormetria es una aplicación web que **registra, organiza y presenta**
información sobre el sueño aportada por la propia persona —diario de sueño y
cuestionarios de autoinforme validados— y la **coteja contra puntos de corte y
rangos de referencia publicados**, de uso corriente en la práctica clínica del
sueño.

Su finalidad es **poner esa información en forma legible** para que un
profesional de la salud matriculado, o la propia persona, la interpreten y
decidan. Dormetria no emite diagnósticos, no indica tratamientos
farmacológicos y no reemplaza el juicio clínico.

Toda la información que Dormetria muestra es **trazable a su fuente**: cada
puntaje indica el instrumento del que proviene, el punto de corte aplicado y
la referencia bibliográfica que lo sostiene, de modo que el usuario pueda
revisar la base de lo que la aplicación presenta y confiar en su propio
criterio.

### 4.2 Usuario previsto

- **Profesionales de la salud matriculados** (medicina, psicología,
  psiquiatría, neurología, neumonología, odontología, fonoaudiología,
  kinesiología, nutrición) que asisten personas con quejas de sueño.
- **Personas adultas** que llevan su propio registro de sueño.
- **Madres, padres o cuidadores** que llevan el registro de un menor a cargo.

### 4.3 Indicación de uso

Dormetria está indicada para:

1. **Llevar un diario de sueño prospectivo** y calcular sus parámetros
   derivados (tiempo total de sueño, latencia, vigilia intrasueño, eficiencia,
   regularidad, siestas).
2. **Administrar y puntuar cuestionarios de autoinforme validados** (ISI,
   Epworth, STOP-BANG, PHQ-9, GAD-7, entre otros), mostrando el puntaje junto
   a su punto de corte publicado y su referencia.
3. **Señalar situaciones que ameritan consulta profesional**, indicando en
   cada caso qué instrumento la señala y con qué umbral.
4. **Ofrecer contenido educativo sobre salud del sueño** y un programa de
   bienestar del sueño autoadministrado, de siete a ocho semanas, basado en
   los componentes con evidencia de la terapia cognitivo-conductual para el
   insomnio, **con excepción de la restricción del tiempo en cama**.
5. **Permitir que un profesional tratante active y supervise el protocolo
   completo**, incluida la restricción del tiempo en cama y el ajuste de la
   ventana de sueño, para un paciente bajo su seguimiento.
6. **Poner en contacto** a quien lo busque con profesionales de la salud, a
   través de un directorio de consulta voluntaria.

### 4.4 Ambiente de uso previsto

Domicilio del usuario y consultorio profesional. No está destinada a uso en
ambiente hospitalario de agudos, cuidados intensivos, quirófano ni en
situaciones de emergencia.

### 4.5 Lo que Dormetria NO hace

Esta sección es tan parte del uso previsto como la anterior.

- **No diagnostica.** Ningún resultado constituye un diagnóstico. Los
  puntajes son de instrumentos de tamizaje, y el tamizaje no es diagnóstico.
- **No indica ni ajusta tratamiento farmacológico.** No sugiere fármacos, no
  sugiere dosis y no recomienda iniciar, cambiar ni suspender medicación.
- **No mide señales fisiológicas.** No registra ni analiza señales de sueño,
  respiratorias, cardíacas ni de movimiento. No reemplaza a la polisomnografía
  ni a la poligrafía respiratoria. Cuando la persona lo autoriza, la aplicación
  puede **precargar** campos del diario con valores que su reloj o anillo ya
  calculó, siempre señalados como tales y siempre confirmables por ella antes
  de guardarse. Dormetria no procesa la señal de esos dispositivos ni deriva
  estadios de sueño, saturación ni eventos respiratorios: el dato que entra al
  cálculo es el que la persona confirmó.
- **No detecta apnea del sueño.** Presenta el resultado de un cuestionario de
  riesgo (STOP-BANG) contra su punto de corte publicado. Confirmar o descartar
  apnea requiere un estudio de sueño.
- **No es un servicio de urgencia.** Ante somnolencia peligrosa, ideación
  suicida o cualquier cuadro agudo, corresponde acudir a un servicio de salud.
- **No reemplaza la consulta.** Ninguna decisión clínica debería tomarse solo
  con lo que muestra la aplicación.
- **No decide por el profesional.** La información se presenta con su base a
  la vista para que el profesional la revise y aplique su criterio.

### 4.6 Contraindicaciones y advertencias

El **protocolo de restricción del tiempo en cama** —disponible únicamente
cuando lo activa un profesional tratante— no debe indicarse sin evaluación
previa en personas con:

- apnea obstructiva del sueño no tratada;
- trastorno bipolar o antecedente de episodio maníaco (la restricción puede
  precipitar un viraje);
- epilepsia o umbral convulsivo bajo;
- trabajo en turnos rotativos o nocturnos;
- somnolencia diurna que comprometa la conducción o la operación de
  maquinaria;
- embarazo;
- menores de 18 años.

### 4.7 Población pediátrica

En menores, quien usa la aplicación es la madre, el padre o el cuidador. Los
rangos de referencia de duración del sueño se toman de la **National Sleep
Foundation (Hirshkowitz et al., 2015)** e incluyen las siestas hasta los seis
años, calculadas sobre 24 horas. Cuando el rango de la **AASM (Paruthi et al.,
2016)** difiere, se muestran ambos. El programa de bienestar del sueño y el
protocolo de restricción **no están indicados en menores de 18 años**.

### 4.8 Base de las referencias utilizadas

| Instrumento / parámetro | Umbral | Fuente |
|---|---|---|
| ISI · cambio mínimo relevante | ≥ 8 puntos | Morin et al., *Sleep* 2011;34(5):601-8 |
| Latencia y vigilia intrasueño | ≥ 31 min | Lichstein et al., 2003 |
| STOP-BANG · riesgo de AOS | ≥ 3 | Chung et al. |
| PHQ-9 · bandas | 5 / 10 / 15 / 20 | Kroenke et al. |
| Duración del sueño por edad | por franja etaria | Hirshkowitz et al., *Sleep Health* 2015;1(1):40-43 |
| Duración del sueño por edad (alt.) | por franja etaria | Paruthi et al., *J Clin Sleep Med* 2016;12(6):785-6 |
| TCC-I · componentes con evidencia | — | AASM 2021; ESRS 2023 |

### 4.9 Tratamiento de datos

Los datos se alojan en Supabase con control de acceso por fila (RLS) en las
doce tablas. Aplican la **Ley 25.326** de protección de datos personales y la
**Ley 26.529** de derechos del paciente. Los datos de salud son datos
sensibles: su tratamiento requiere consentimiento libre, expreso e informado,
y el titular puede acceder, rectificar y suprimir sus datos.

El uso de datos con fines de investigación requiere un **consentimiento
separado, específico y revocable**; negarlo no limita el uso de la aplicación.

### 4.10 Modelo de financiamiento

El uso para el paciente es gratuito en su registro de sueño y en el
tamizaje. Los profesionales pueden abonar por figurar en el directorio. **El
directorio no se muestra dentro de ninguna pantalla de resultado ni de alerta
clínica, y su orden no depende del pago ni del resultado de ningún
instrumento.**

---

## 5. Lo que hay que cambiar en el código para que esto sea verdad

Un uso previsto que no describe lo que la app hace es peor que no tener uno:
es una declaración falsa por escrito. Esto es la diferencia entre el documento
de arriba y el estado actual:

| # | Qué | Por qué |
|---|---|---|
| 1 | Sacar "Fármaco" de la tarjeta Conducta sugerida | Es lo que rompe el criterio 3 del uso 1 |
| 2 | Mostrar la fuente de cada punto de corte en pantalla | Criterio 4 de ANMAT + guía 1.4.1 de Apple |
| 3 | Redactar las banderas como cotejo, no como detección | "Apnea probable" → "STOP-BANG 5/8; desde 3 se recomienda estudio" |
| 4 | Revisar la bandera de somnolencia al volante | No debe indicar una conducta de corto plazo |
| 5 | Partir el programa: bienestar (libre) / restricción (profesional) | Es la decisión de la sección 3 |
| 6 | Sacar el directorio de las pantallas de resultado | Sección 1 |
| 7 | Consentimiento de investigación separado del de uso | Ley 25.326 |
| 8 | Importar wearables **solo** como precarga confirmable | Ver abajo — corregí lo que había dicho |

Los puntos 1 a 4 y 6 a 7 los puedo hacer esta semana. El 5 depende de tu
decisión.

**Corrección sobre el punto 8.** En la primera versión de este documento puse
"bloquear la importación de señales o wearables" como regla dura. Era
demasiado gruesa y estaba mal. La aclaración de ANMAT al criterio 1 dice:

> "El software que adquiere imágenes y datos de dispositivos médicos
> **únicamente con el propósito de mostrar, almacenar, transferir o
> formatear** se conoce comúnmente como Sistemas de datos de dispositivos
> médicos (MDDS) y **no califica como un dispositivo médico**."

O sea que la línea no está en *importar*, está en *analizar*:

| Se puede | No se puede |
|---|---|
| Traer de Apple Health / Health Connect los valores **ya derivados** (hora de dormir, hora de despertar, minutos despierto) para **precargar** el campo, que la persona confirma o corrige | Traer la señal cruda (PPG, SpO2, acelerometría) y calcular algo con ella |
| Mostrar el dato con su procedencia a la vista ("autocompletado por tu reloj") | Usar los estadios de sueño del reloj (REM/profundo) para cualquier afirmación clínica |
| Registrar que el reloj del paciente **le notificó** posible apnea, como un dato que él reporta | Derivar nada de la oximetría: ANMAT nombra la detección de apnea como ejemplo de SaMD |
| Que el dato del reloj entre al cálculo **después** de que la persona lo confirmó | Que el dato del reloj entre al motor sin confirmación |

El detalle completo, con la parte clínica, está en
`WEARABLES-y-lecciones-de-REST.md`.

---

## 6. Lo que necesito de vos

1. **¿Sacamos la sugerencia de fármaco?** Es la decisión que más mueve el
   encuadre y es de una línea.
2. **El programa autoadministrado: ¿con o sin restricción de sueño?** Si va
   con restricción, es un dispositivo médico y hay que registrarlo antes de
   publicar.
3. **¿El uso ocupacional entra en esta versión?** Mi recomendación es que no.
4. **¿Confirmás el cambio del directorio?** Que salga de las pantallas de
   resultado.

---

## Fuentes

- [ANMAT · Disposición 64/2025 (texto)](https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-64-2025-408309/texto)
- [ANMAT · Guía SaMD/MLMD para la industria (ANMAT-PME-SOF 001-00)](https://opinionpublica.anmat.gob.ar/proyectos/5293.pdf)
- [ANMAT · Criterios regulatorios para SaMD](https://www.argentina.gob.ar/noticias/anmat-actualiza-los-criterios-regulatorios-para-software-como-dispositivo-medico-samd)
- [MERCOSUR · Resolución GMC 25/2021](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-25-2021-408310/texto)
- [Apple · App Review Guidelines (1.4.1 y 5.1.3)](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play · Health apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291?hl=en)
