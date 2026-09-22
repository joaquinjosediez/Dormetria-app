# Dormetria en App Store y Google Play · la ruta real

Pediste los pasos para agilizar. Antes de la lista conviene decir lo que la
lista no dice: **la tienda no es el cuello de botella.** Hay dos cosas delante,
y una de ellas puede cambiar qué es Dormetria legalmente.

Todo lo de abajo es información pública de Apple, Google y ANMAT al
22-sep-2026, con los enlaces al final. No soy abogado ni consultor
regulatorio: lo de la sección 1 hay que confirmarlo con alguien que lo sea
antes de mover dinero.

---

## 1. Lo primero: ¿Dormetria es software como producto médico?

**[Seguro]** ANMAT actualizó los criterios de **Software como Dispositivo
Médico (SaMD)** con la **Disposición 64/25**. Define como SaMD al software
cuyo uso previsto por el fabricante sea *diagnóstico, prevención, tratamiento
o mitigación* de una patología, y que cumpla esa función sin ser parte del
hardware de un producto médico. Si encuadra, el registro y la autorización
sanitaria son **obligatorios y previos** a la comercialización.

**[Seguro]** Entre los ejemplos que ANMAT da de software alcanzado figura
textualmente la **detección de apnea del sueño** mediante software clínico con
funciones de análisis.

**[Suposición — esto es lo que hay que confirmar]** Dormetria hoy hace cosas
que se parecen mucho a eso:

| Lo que hace la app | Cómo se lee desde la definición |
|---|---|
| "Compatible con patrón de insomnio de mantenimiento" | orientación diagnóstica |
| Bandera "Apnea probable · derivar a PSG" | tamizaje de una patología |
| "Conducta sugerida · Primera línea · Fármaco" | sugerencia terapéutica |
| Score de sueño con punto de corte | medición con interpretación |

El argumento en contra —y es un argumento razonable— es que Dormetria **no
decide, informa a un profesional matriculado que decide**, y que los puntajes
salen de escalas ya validadas (ISI, STOP-BANG, PHQ-9) que el médico podría
calcular a mano. Esa distinción existe en la práctica regulatoria. Pero no es
una distinción que uno se pueda auto-adjudicar: depende de **cómo está escrito
el uso previsto**, y hoy el uso previsto de Dormetria no está escrito en
ningún lado.

**Lo que conviene hacer ya, y es gratis:** redactar el *intended use statement*
—una página— que diga qué hace la app, para quién, y qué explícitamente no
hace. Ese documento es lo primero que te va a pedir cualquiera: ANMAT, un
consultor regulatorio, y también Apple si te toca revisión bajo la guía 1.4.1.
Lo puedo redactar en cuanto me digas cómo querés posicionarla.

**Por qué importa más ahora que antes.** En el piloto Dormetria se usa entre
colegas. Publicada en una tienda pasa a estar ofrecida al público en general,
y ese es el hecho que activa el encuadre. Apurar la tienda sin resolver esto
es apurar justo la parte que sube el riesgo.

---

## 2. Lo segundo: hace falta una persona jurídica

**[Seguro]** Google cerró la puerta a las cuentas personales para apps de
salud. Las que ya estaban tuvieron plazo hasta el **28 de enero de 2026** para
migrar a una **cuenta de Organización verificada**; ese plazo ya pasó. El
motivo declarado es explícito: que si una app de salud filtra datos sensibles
haya una entidad legal responsable, no una persona.

**[Seguro]** Una cuenta de Organización —en Google y en Apple— necesita
**número D-U-N-S**, que Dun & Bradstreet asigna a entidades legales. Es
gratuito, pero se pide para una entidad, no para vos como individuo.

O sea: **sin sociedad no hay Google Play.** Eso hoy no existe en el proyecto y
es el ítem de plazo más largo de toda la lista. Constituir la sociedad, sacar
el D-U-N-S y que Google verifique la cuenta son semanas, en el mejor caso.

**Esto es lo que podés empezar hoy mismo y correr en paralelo con todo lo
demás.** Es lo que más te agiliza el cronograma, y no depende de mí ni del
código.

---

## 3. El problema técnico: Dormetria es una PWA

Un solo archivo HTML servido por Netlify. Eso no es un obstáculo en Android y
sí lo es en iOS.

### Android — se resuelve

**[Probable]** El camino es **TWA (Trusted Web Activity)**: un contenedor que
abre tu PWA a pantalla completa, sin barra de navegador. Google lo acepta
porque es tecnología propia. Se genera con Bubblewrap o PWABuilder. Requisitos
prácticos: manifest completo, service worker, íconos en todas las medidas,
y el archivo `assetlinks.json` en el dominio para probar que sos el dueño.

Trabajo real: días, no meses.

### iOS — acá está la pelea

**[Seguro]** La guía **4.2 (Minimum Functionality)** de Apple dice que la app
tiene que tener funciones, contenido e interfaz que la eleven por encima de un
sitio web reempaquetado. Apple llama *web clippings* a exactamente lo que
produce un envoltorio de PWA, y el rechazo típico dice que la app "no es
suficientemente distinta de una experiencia de navegación web".

**[Probable]** El patrón que sí pasa: **dos o tres capacidades nativas
sustantivas** que tengan sentido en el producto, más una nota al revisor
señalándolas. Para Dormetria las candidatas naturales son:

1. **Notificaciones push nativas** para el recordatorio del diario. Además de
   resolver la 4.2, es lo que más te falta para adherencia —el tema del
   WhatsApp— y sirve aunque nunca publiques en iOS.
2. **Modo offline de verdad**: cargar el diario sin señal y sincronizar
   después. Clínicamente correcto: el diario se completa al despertarse, no
   cuando hay wifi.
3. **Face ID / Touch ID** para abrir la app. Con datos clínicos adentro es
   defendible por sí solo, no como excusa para la tienda.

Cualquiera de las tres es trabajo de verdad, no configuración.

### La otra pregunta, que conviene hacerse

¿Para qué querés la tienda? Si es **distribución** —que el paciente la
encuentre—, la tienda importa. Si es **legitimidad frente al colega**, la
tienda ayuda menos de lo que parece y el `.com.ar` con el protocolo publicado
ayuda más. Si es **adherencia del paciente**, lo que mueve la aguja son las
notificaciones, y esas las podés tener en Android y en la web sin pasar por
Apple.

**[Suposición]** Mi lectura: **Android primero, iOS después.** Android es
semanas y es el 80% del parque en Argentina. iOS es meses y te obliga a
escribir código nativo. Hacer los dos en paralelo duplica el trabajo en el
punto de menor retorno.

---

## 4. Lo que hay que preparar para las dos tiendas

Esto se puede escribir ya, y es cuello de botella de nadie.

### Google Play

- **Declaración de Health Apps** en Play Console. **[Seguro]** Es obligatoria
  para toda app publicada, incluso en pruebas cerradas, y aunque no ofrezca
  funciones de salud. Dormetria sí las ofrece, así que hay que completarla en
  serio.
- **Política de privacidad** publicada en dormetria.com, con URL estable.
  Tiene que nombrar la Ley 25.326 y decir qué datos se recogen, dónde viven
  (Supabase) y cómo se piden la baja y el borrado.
- **Data safety form**: qué se recolecta, si se comparte, si está cifrado en
  tránsito, si el usuario puede pedir el borrado.
- **Pruebas cerradas**: **[Seguro]** para cuentas personales creadas después
  del 13-nov-2023, hacen falta **12 testers opt-in durante 14 días
  corridos**. El reloj arranca cuando la versión queda aprobada con 12
  adentro, y si alguien se sale, se sale. Tus colegas del piloto son
  exactamente esos 12 — pero tienen que estar opt-in y quedarse.
  Confirmá con el consultor si la cuenta de Organización te exime: la regla
  está redactada para cuentas personales, y no quiero que planifiques sobre
  mi lectura de una letra chica.

### Apple

- **[Seguro]** Apple Developer Program: **USD 99 por año**. Organización:
  D-U-N-S, más autoridad para firmar por la entidad.
- **[Seguro] Guía 1.4.1 — apps médicas.** Se revisan con más escrutinio. Hay
  que declarar datos y metodología que respalden cualquier afirmación de
  exactitud sobre mediciones de salud; si la exactitud o la metodología no se
  pueden validar, rechazan. Y la app tiene que recordarle al usuario que
  consulte con un médico antes de tomar decisiones médicas.
  Traducido a Dormetria: **cada punto de corte necesita su cita.** ISI 8,
  STOP-BANG 3, PHQ-9 10/15/20, NSF 2015 para los rangos pediátricos. Eso ya
  está adentro del código; hay que juntarlo en un documento.
- **[Seguro] Guía 5.1.3 — investigación en humanos.** Si la app hace
  investigación con sujetos humanos, hace falta aprobación de un comité de
  ética independiente, y la pueden pedir. **Esto te toca de lleno con la
  validación de la EEDSI.** Si esa ruta va adentro de la app publicada, el
  protocolo aprobado pasa a ser un requisito de la tienda, no solo del
  estudio. Conviene que la ruta del QR viva **fuera** de la app de la tienda.
- **[Seguro]** Desde 2026 la ficha de la app muestra en EEA, Reino Unido y
  Estados Unidos si está clasificada como producto médico regulado. Aplica a
  apps cuya categoría sea Salud y forma física o Medicina. O sea: Apple ahora
  te pregunta por el encuadre regulatorio de la sección 1. No hay forma de
  esquivar esa pregunta llegando a la tienda primero.

---

## 5. El orden que yo seguiría

| # | Qué | Quién | Cuándo |
|---|---|---|---|
| 1 | Consultor regulatorio: ¿SaMD sí o no? | vos | ahora |
| 2 | Escribir el *intended use* | yo, con tu definición | esta semana |
| 3 | Constituir la entidad + D-U-N-S | vos / contador | ahora, en paralelo |
| 4 | Política de privacidad en dormetria.com | yo | esta semana |
| 5 | Dossier de puntos de corte con citas | yo | esta semana |
| 6 | PWA lista para TWA (manifest, SW, assetlinks) | yo | 1–2 semanas |
| 7 | Notificaciones push nativas | yo | 2–3 semanas |
| 8 | Cuenta de Organización en Play + verificación | vos | tras el D-U-N-S |
| 9 | Prueba cerrada con tus 12 colegas, 14 días | vos | tras el 8 |
| 10 | Publicación en Play | ambos | tras el 9 |
| 11 | iOS | — | después, y con otra conversación |

Los pasos 1, 3 y 8 son tuyos y son los largos. Los 2, 4, 5, 6 y 7 son míos y
no dependen de nada: puedo arrancar hoy.

---

## 6. Sobre la app que te mencionaron

No sé cuál es —"REST" puede ser varias— y prefiero no opinar sobre un producto
que no vi. Pero la conclusión que sacaste de que la estén traduciendo, que es
que hay una ventana, no depende de qué app sea: **la ventana la cierra el
tiempo de la sección 2 y 3, no el de ellos.** Si querés, pasame el nombre o el
enlace y la miro en serio: qué prometen, cómo encuadran el uso previsto y
cómo resolvieron la parte regulatoria. Eso último es lo más útil de mirar,
porque es el problema que vos tenés adelante.

---

## 7. Lo que necesito de vos

1. **¿Dormetria es una herramienta para el profesional o un producto para el
   paciente?** No es una pregunta de marketing: de esa respuesta sale el
   *intended use*, y del *intended use* sale casi todo lo demás.
2. **¿Hay entidad legal en camino?** Si no, ese es el paso 1 real.
3. **¿La validación de la EEDSI va adentro de la app publicada?** Si va, entra
   la guía 5.1.3 de Apple y el protocolo pasa a ser requisito de tienda.
4. **¿Android primero, o las dos juntas?** Mi recomendación está arriba, pero
   es tu llamada.

---

## Fuentes

- [ANMAT · Software como Dispositivo Médico (SaMD)](https://www.argentina.gob.ar/noticias/anmat-actualiza-los-criterios-regulatorios-para-software-como-dispositivo-medico-samd)
- [ANMAT · Productos Médicos](https://www.argentina.gob.ar/anmat/regulados/productos-medicos)
- [Apple · App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple · Enrollment / D-U-N-S](https://developer.apple.com/help/account/membership/program-enrollment/)
- [Apple · Apple Developer Program](https://developer.apple.com/programs/enroll/)
- [9to5Mac · Nueva política de divulgación de producto médico regulado](https://9to5mac.com/2026/03/26/new-app-store-policy-requires-medical-device-disclosures-for-some-health-apps/)
- [Google Play · Health apps declaration form](https://support.google.com/googleplay/android-developer/answer/14738291?hl=en)
- [Google Play · Health app categories](https://support.google.com/googleplay/android-developer/answer/13996367?hl=en)
- [Google Play · Verificación de identidad del desarrollador](https://support.google.com/googleplay/android-developer/answer/10841920?hl=en)
- [Android Developers · Publicar una app de salud](https://developer.android.com/health-and-fitness/health-connect/publish)
