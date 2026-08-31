# Cobros en Dormetria · análisis, precios y cómo integrarlo

Agosto 2026. Todo lo que dice **[Seguro]** está verificado contra fuente;
**[Probable]** es inferencia fuerte; **[Suposición]** es que estoy completando
lo que falta.

---

## Antes de los precios: la pregunta que todavía no contestaste

Tenés 92 pacientes y colegas empezando a probar. Lo que te falta para cobrar
no es la pasarela de pago — eso son dos semanas. Lo que falta es decidir
**quién paga**, y esa decisión cambia todo lo demás.

Ya lo discutimos y mi recomendación no cambió: **que pague el profesional, no
el paciente.** Tres razones, ahora con un número más:

- El paciente que llega solo hace un tratamiento de 7 semanas y se va. No es
  fuga: es el tratamiento funcionando. Cobrarle una suscripción mensual te
  pone del lado equivocado del incentivo — ganás más si no mejora.
- El profesional usa la herramienta todos los días, durante años.
- **[Seguro]** Cobrar en Argentina cuesta entre 6,29% y 6,49% + IVA por
  transacción con tarjeta de crédito en Mercado Pago. Con IVA sobre la
  comisión, el costo real ronda el **7,8%**. Sobre una suscripción mensual de
  $29.000 eso son $2.260 por mes por cliente. Sobre un pago único de $65.000
  al paciente, $5.100 una vez. **Muchos cobros chicos te cuestan más que
  pocos cobros grandes**, y el modelo del paciente directo es el de muchos
  cobros chicos.

---

## Los planes

### Profesional

| | **Consultorio** | **Práctica** | **Instituto** |
|---|---|---|---|
| | **Gratis** | **$29.000**/mes | **$79.000**/mes |
| Pacientes | hasta 5 | ilimitados | ilimitados |
| Diario, actograma, métricas | ✓ | ✓ | ✓ |
| Escalas y alertas de riesgo | ✓ | ✓ | ✓ |
| Sugerir escalas y material | ✓ | ✓ | ✓ |
| Informes con IA | 3/mes | 30/mes | 150/mes |
| Análisis de estudios con IA | — | 10/mes | 40/mes |
| Perfil en el directorio | — | ✓ | ✓ destacado |
| Licencias de TCC-I | — | 1 incluida/mes | 5 incluidas/mes |
| Licencias extra | — | $45.000 c/u | $32.000 c/u |
| Varias cuentas | — | — | hasta 5 |
| Exportar la base | — | ✓ | ✓ |

**Por qué $29.000.** **[Probable]** Las herramientas de gestión para
psicólogos en Argentina están entre $21.900 y $30.000/mes. Dormetria hace
otra cosa —no reemplaza al software de gestión, convive con él— pero si
entrás muy por encima de esa banda te sacan de la conversación antes de
empezar. $29.000 es menos del 25% de una sola consulta tuya.

**El plan gratis con 5 pacientes es el canal, no generosidad.** Nadie decide
comprar leyendo una web; deciden cuando ven el actograma de un paciente real
suyo. Cinco alcanza para eso y no alcanza para trabajar.

### Paciente

| | **Diario** | **Programa** | **Programa acompañado** |
|---|---|---|---|
| | **Gratis** | **$65.000** único | **$45.000** único |
| | | | *(lo entrega su profesional)* |
| Diario, gráficos, actograma | ✓ | ✓ | ✓ |
| Escalas y alertas | ✓ | ✓ | ✓ |
| Material educativo | ✓ | ✓ | ✓ |
| Semana 1 del TCC-I | ✓ | ✓ | ✓ |
| Semanas 2 a 7 | — | ✓ | ✓ |
| Ajuste automático semanal | — | ✓ | ✓ |
| Su profesional ve el avance | — | — | ✓ |

**Sí, el acompañado sale menos, y es el centro de la propuesta.** Querés
empujar a todos hacia el acompañado: funciona mejor y lo paga el profesional,
que ya te compró el plan. El que llega solo paga más porque se lleva la
versión que rinde menos.

**La semana 1 gratis siempre.** Es psicoeducación. Quien la termina y quiere
seguir ya sabe qué está comprando.

---

## Ventanas gratuitas: cuál sí y cuál no

Preguntaste por ventanas temporales o por cantidad de pacientes. No son
equivalentes.

| Modelo | Qué pasa en la práctica |
|---|---|
| **Límite de 5 pacientes, para siempre** | **El que recomiendo.** El profesional se queda todo el tiempo que necesite, y el día que su consultorio crece, paga. La conversión llega sola y sin presión. |
| 30 días gratis de todo | Aprieta al profesional a evaluar en un mes. En medicina del sueño **un mes no alcanza**: el diario necesita 4 a 8 semanas para que los gráficos digan algo. Le estarías pidiendo que decida justo antes de ver el valor. |
| 90 días gratis de todo | Mejor que 30, pero al día 91 se le apaga todo con pacientes reales adentro. Eso genera enojo, no conversión. |

**[Probable]** El límite por cantidad le gana a la ventana temporal en este
producto específico, porque tu ciclo de valor es largo. Un límite por
cantidad nunca le quita nada a nadie: sólo le impide crecer gratis.

**Si querés combinar**, la única mezcla que funciona: gratis hasta 5 pacientes
*para siempre*, más los primeros 60 días con las funciones de Práctica
desbloqueadas para que vea qué se está perdiendo. Al día 61 no pierde datos ni
pacientes, sólo vuelve a 5 y a los informes limitados.

---

## Los medios de cobro

### Lo primero, que es lo que más sorprende

**[Seguro] Stripe no opera con entidades argentinas.** Argentina no está
entre los países soportados; una persona o empresa argentina no puede abrir
cuenta para procesar pagos locales. La vuelta que usa todo el mundo es
constituir una LLC en Estados Unidos, lo cual es legal pero te agrega
contabilidad en dos países. **No lo hagas para vender en Argentina.**

### Comparación

| | **Mercado Pago** | **Stripe** (vía LLC US) | **PayPal** | **Paddle / Lemon Squeezy** |
|---|---|---|---|---|
| ¿Sirve para Argentina? | **Sí** | No directo | Limitado | Sólo exterior |
| Tarjeta de crédito | **[Seguro]** 6,29–6,49% + IVA | ~2,9% + fijo | **[Seguro]** ~5,4% + fijo | 5% + 0,50 USD |
| Costo real con IVA | **≈7,8%** | — | — | — |
| Débito | **[Seguro]** 3,25% + IVA | — | — | — |
| Acreditación a 14 días | **[Seguro]** ~3,49% + IVA | — | — | — |
| Suscripciones automáticas | Sí | Sí | Sí | Sí |
| Cuotas | **Sí** | No en AR | No | No |
| Se encarga de impuestos | No | No | No | **Sí (MoR)** |

**Dos cosas que cambian el número:**

1. **[Seguro] El IVA va sobre la comisión.** 6,49% se convierte en 7,85%
   real. Si tu precio de lista es $29.000, te entran ~$26.700.
2. **[Seguro] Ingresos Brutos varía por provincia**, así que tu comisión real
   depende de dónde estés inscripto. El número exacto lo tenés que sacar con
   tu contador, no conmigo.

**La palanca más grande que tenés y casi nadie usa: la acreditación.**
**[Seguro]** Cobrar a 14 días en vez de inmediato baja la comisión de ~6,49%
a ~3,49%. **Es casi la mitad.** En una suscripción mensual recurrente esperar
14 días no te cambia la vida — no estás financiando stock. Sobre 50
profesionales a $29.000, la diferencia es de unos **$44.000 por mes** que te
quedás vos.

### Mi recomendación

**Mercado Pago para Argentina, y nada más por ahora.** No es la más barata
del mundo, pero es la que tus clientes ya tienen instalada, la única que
ofrece cuotas, y la que evita que un colega abandone en el checkout porque le
piden una tarjeta internacional. La fricción te cuesta más que la comisión.

**Dejá el cobro internacional para cuando aparezca el primer cliente de
afuera.** Diseñar hoy para un mercado que no tenés es la forma más común de
no lanzar nunca.

---

## Los pasos, en orden

### Paso 0 · Lo que no es software (y es lo que más tarda)

**Nada de lo demás sirve sin esto.**

1. **Definir la figura fiscal.** Monotributo o responsable inscripto. Con 50
   profesionales a $29.000 estás en ~$1.450.000/mes de facturación, y eso
   **[Probable]** te saca de las categorías bajas del monotributo. Preguntale
   a tu contador *antes* de fijar precios, no después.
2. **Facturación automática.** Cada cobro necesita su factura. Si lo hacés a
   mano, a los 30 clientes ya no das abasto. Hay servicios que emiten contra
   ARCA por API.
3. **Términos comerciales.** Qué pasa si alguien deja de pagar, cómo se da de
   baja, política de reintegros. **Mi recomendación fuerte: los datos no se
   tocan nunca.** Se apagan funciones, no historias clínicas. Un profesional
   que pierde acceso a las fichas de sus pacientes por una tarjeta vencida es
   un problema clínico, no comercial.
4. **Baja autogestionada.** Si para darse de baja hay que escribirte, la
   gente no se da de baja: hace un contracargo con la tarjeta. Un contracargo
   te cuesta más que el mes que perdiste.

### Paso 1 · La base de datos (1 día)

```sql
-- ═══════════════════════════════════════════════════════════════════
--  Dormetria · suscripciones
--
--  La app NUNCA decide sola si alguien pagó: lee estas columnas, que
--  las escribe el servidor al recibir el aviso de Mercado Pago. Si la
--  app pudiera decidirlo, cualquiera con la consola del navegador
--  abierta se daría el plan Instituto.
-- ═══════════════════════════════════════════════════════════════════

alter table public.doctors add column if not exists plan            text default 'consultorio';
alter table public.doctors add column if not exists plan_hasta      timestamptz;
alter table public.doctors add column if not exists plan_estado     text default 'activo';
alter table public.doctors add column if not exists mp_customer_id  text;
alter table public.doctors add column if not exists mp_preapproval  text;

alter table public.patients add column if not exists tcci_licencia       text;
alter table public.patients add column if not exists tcci_licencia_desde timestamptz;
alter table public.patients add column if not exists tcci_licencia_por   text;

create table if not exists public.pagos (
  id            bigserial primary key,
  email         text not null,
  rol           text not null,
  concepto      text not null,
  monto         numeric(12,2),
  moneda        text default 'ARS',
  estado        text not null,
  mp_payment_id text unique,
  crudo         jsonb,
  creado        timestamptz default now()
);

create index if not exists pagos_email_idx on public.pagos (lower(email));

-- Nadie puede escribir su propio plan desde el navegador.
alter table public.pagos enable row level security;

drop policy if exists pagos_solo_lectura_propia on public.pagos;
create policy pagos_solo_lectura_propia on public.pagos
  for select to authenticated
  using ( lower(email) = lower(auth.jwt() ->> 'email') );

drop policy if exists doctors_plan_no_se_toca on public.doctors;
create policy doctors_plan_no_se_toca on public.doctors
  as restrictive for update to authenticated
  using (true)
  with check (
    plan       is not distinct from (select d.plan       from public.doctors d where d.id = doctors.id)
    and plan_hasta  is not distinct from (select d.plan_hasta  from public.doctors d where d.id = doctors.id)
    and plan_estado is not distinct from (select d.plan_estado from public.doctors d where d.id = doctors.id)
  );

notify pgrst, 'reload schema';
```

> La última política es la importante: deja que el profesional edite su
> perfil, pero **no** las tres columnas del plan. Sólo el servidor, que usa
> la clave de servicio y no pasa por RLS, las puede cambiar.

### Paso 2 · Cuenta y credenciales (1 día)

1. Cuenta de Mercado Pago **con CUIT**, no la personal.
2. En *Tus integraciones* → crear la aplicación → guardar el **Access Token**
   de producción.
3. **Ese token va SOLO en las variables de entorno de Supabase.** Nunca en
   `index.html`. Si aparece en el navegador, cualquiera puede emitir cobros
   en tu nombre. Es la misma regla que ya aplicamos con la clave de servicio
   y con la de Anthropic.

### Paso 3 · Dos Edge Functions (3 a 5 días)

**`crear-suscripcion`** — recibe qué plan quiere el profesional, arma la
suscripción contra Mercado Pago y devuelve el link de pago.

**`webhook-mercadopago`** — Mercado Pago avisa acá cuando un pago se aprueba,
se rechaza o se cancela. Esta función escribe `plan` y `plan_hasta`.

**Tres cosas que hacen que esto funcione o falle:**

- **Verificar la firma del aviso.** Sin eso, cualquiera puede mandarle a tu
  webhook un "pago aprobado" falso y darse el plan que quiera.
- **Que sea idempotente.** Mercado Pago manda el mismo aviso varias veces —
  a propósito, para asegurarse de que llegue. Si lo procesás dos veces,
  cobrás dos veces. El `unique` en `mp_payment_id` es lo que lo evita.
- **Guardar el aviso crudo en `crudo`.** El día que un cobro no cuadre, esa
  columna es la diferencia entre resolverlo en diez minutos y no poder
  resolverlo.

### Paso 4 · La app lee el plan (2 a 3 días)

Una sola función que decide todo:

```js
// El plan se LEE del perfil, nunca se calcula en el navegador.
function dmPlan(){
  const d = (S.role === 'doctor') ? S.user : null;
  if(!d) return 'consultorio';
  if(d.plan_estado !== 'activo') return 'consultorio';
  if(d.plan_hasta && new Date(d.plan_hasta) < new Date()) return 'consultorio';
  return d.plan || 'consultorio';
}

function dmPuede(que){
  const p = dmPlan();
  const T = {
    consultorio: { pacientes:5,        informesIA:3,   estudiosIA:0,  directorio:false, exportar:false },
    practica:    { pacientes:Infinity, informesIA:30,  estudiosIA:10, directorio:true,  exportar:true  },
    instituto:   { pacientes:Infinity, informesIA:150, estudiosIA:40, directorio:true,  exportar:true  }
  };
  return (T[p] || T.consultorio)[que];
}
```

**Y del lado del servidor la misma comprobación otra vez.** Lo del navegador
es para que la interfaz se vea bien; lo que protege de verdad es lo del
servidor. Si el tope de informes con IA sólo vive en el navegador, alguien lo
saltea y te consume la cuenta de Anthropic.

### Paso 5 · Probar sin plata real (2 días)

Mercado Pago tiene tarjetas de prueba y usuarios de prueba. **Probá los
cuatro caminos**, no sólo el que sale bien: pago aprobado, pago rechazado,
suscripción cancelada, y tarjeta que vence a mitad de mes. **[Probable]** El
tercero y el cuarto son los que rompen en producción, porque son los que
nadie prueba.

### Cuánto tarda

| | |
|---|---|
| Base de datos | 1 día |
| Cuenta y credenciales | 1 día |
| Edge Functions | 3 a 5 días |
| La app lee el plan | 2 a 3 días |
| Pruebas | 2 días |
| **Software** | **~2 semanas** |
| **Lo fiscal y legal (paso 0)** | **[Suposición]** 3 a 6 semanas, en paralelo |

**El software no es el cuello de botella. El paso 0 sí.**

---

## Cómo lo lanzaría

**Fase 1 · los primeros 20 profesionales.** Precio fundador: Práctica a
$19.000 de por vida para el que entre ahora. No es un descuento, es comprar
información: esos 20 te dicen qué funciones usan y cuánto pagarían de verdad.
Un descuento a cambio de que te contesten.

**Fase 2 · abrir el TCC-I.** Sólo el acompañado, para que el único camino sea
a través de un profesional. Te da control sobre la calidad mientras el
producto es joven.

**Fase 3 · el paciente directo.** Recién cuando tengas 20 o 30 personas que
terminaron el programa y puedas mostrar resultados propios.

---

## El problema argentino: la inflación

Un precio en pesos fijado hoy vale bastante menos en seis meses. Cobrar en
dólares le traslada la volatilidad al cliente y acá se siente como abuso.

**Una alternativa que casi nadie usa y que encaja bien:** anclar el precio a
una fracción de la consulta del propio profesional.

> Práctica = **el 20% de una consulta por mes**.
> Una licencia de TCC-I = **un tercio de una consulta**.

Se ajusta solo, se explica en una frase, y le suena justo a quien lo paga
porque está atado a lo que él mismo cobra. El número exacto lo calcula la app
con el valor que ya tiene cargado en su perfil.

Si te parece demasiado raro, la opción conservadora es precio en pesos con
ajuste trimestral anunciado, y quien ya está adentro mantiene el suyo 12
meses.

---

## Lo que no se cobra nunca

Esto no es una decisión comercial, es una línea:

- **Las alertas clínicas.** Riesgo de apnea, somnolencia al volante, banderas
  rojas. Si alguien tiene una apnea sin diagnosticar, la app se lo tiene que
  decir aunque no haya pagado nunca.
- **El diario y sus métricas básicas.** Es lo que hace que la persona vuelva.
- **El acceso del profesional a las fichas de sus pacientes.** Si deja de
  pagar pierde funciones, no historias clínicas.

---

## Lo que no sé

- **[Suposición] Cuánto pagaría de verdad un colega argentino por esto.** Los
  precios están anclados a lo que cobran herramientas parecidas, no a
  entrevistas con tus colegas. **Cinco conversaciones de veinte minutos
  valdrían más que todo este documento** — y justo ahora tenés colegas
  entrando a probar la demo. Preguntales.
- **[Suposición] Cuánta gente termina el programa.** La adherencia al TCC-I
  digital autoguiado es un problema conocido. Si termina el 20%, el modelo
  del paciente directo no cierra.
- **Tu situación fiscal concreta.** No soy contador y esto no es asesoramiento
  impositivo. Los números de comisiones están verificados; qué te conviene a
  vos según tu categoría y provincia, no.

---

## Fuentes

- [Comisiones de Mercado Pago en Argentina 2026](https://www.jonatanalmeira.com/comisiones-de-mercado-pago-en-argentina-cuanto-cobra-realmente/)
- [Comisiones de pasarelas de pago en Argentina 2026 — comparativa](https://talo.com.ar/blogs/comisiones-pasarelas-de-pago)
- [Suscripciones en Mercado Pago Argentina](https://www.mercadopago.com.ar/herramientas-para-vender/suscripciones)
- [Cómo integrar un plan de suscripción en tu sitio — Mercado Pago](https://www.mercadopago.com.ar/ayuda/19325)
- [Disponibilidad internacional de Stripe](https://stripe.com/global)
- [Mercado Pago vs Stripe en Argentina](https://lupapago.com/mercado-pago-vs-stripe/)
- [Calculadora de comisiones de PayPal Argentina 2026](https://www.jonatanalmeira.com/calculadora-paypal-argentina/)
- [Merchant of Record para SaaS — guía 2026](https://fungies.io/merchant-of-record-for-saas-guide-2026/)
