# Los correos de Supabase, en castellano

El mail de recuperación de contraseña **no lo manda la app**: lo manda Supabase
Auth con sus plantillas de fábrica, que vienen en inglés. No hay nada que
tocar en el código — hay que editarlas en el panel.

**Supabase → Authentication → Emails → Templates.** Link directo:
`supabase.com/dashboard/project/_/auth/templates` (el `_` lo resuelve solo al
proyecto activo). Hay una pestaña por tipo de correo, cada una con asunto y
cuerpo en HTML crudo — no hay editor visual.

> **Ojo con el plan.** Desde el 3 de junio de 2026, los proyectos **nuevos** en
> plan gratuito que usan el mail por defecto de Supabase ya no pueden editar
> estas plantillas. Los proyectos creados antes conservan la edición, y el
> nuestro es de abril de 2026, así que entra. Configurar SMTP propio devuelve
> la edición en cualquier plan — y conviene por otra razón, abajo.

Las variables (`{{ .ConfirmationURL }}`, `{{ .Email }}`) van tal cual, con las
llaves dobles. Si se rompen, el enlace deja de funcionar.

---

## Reset Password (el que reportó el paciente)

**Asunto:**

```
Restablecer tu contraseña de Dormetria
```

**Cuerpo:**

```html
<h2>Restablecer tu contraseña</h2>
<p>Recibimos un pedido para cambiar la contraseña de tu cuenta de Dormetria.</p>
<p><a href="{{ .ConfirmationURL }}">Elegir una contraseña nueva</a></p>
<p>El enlace vence en una hora y se puede usar una sola vez.</p>
<p>Si no pediste esto, podés ignorar este correo: tu contraseña no cambia.</p>
```

## Confirm Signup

**Asunto:**

```
Confirmá tu cuenta de Dormetria
```

**Cuerpo:**

```html
<h2>Bienvenido/a a Dormetria</h2>
<p>Para terminar de crear tu cuenta, confirmá tu correo:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi correo</a></p>
<p>Si no creaste ninguna cuenta, podés ignorar este mensaje.</p>
```

## Magic Link

**Asunto:**

```
Tu enlace de acceso a Dormetria
```

**Cuerpo:**

```html
<h2>Entrar a Dormetria</h2>
<p><a href="{{ .ConfirmationURL }}">Entrar a mi cuenta</a></p>
<p>El enlace vence en una hora y se puede usar una sola vez.
Si no lo pediste, ignorá este correo.</p>
```

## Change Email Address

**Asunto:**

```
Confirmá tu nuevo correo en Dormetria
```

**Cuerpo:**

```html
<h2>Cambio de correo</h2>
<p>Pediste cambiar el correo de tu cuenta a <strong>{{ .Email }}</strong>.</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar el cambio</a></p>
<p>Si no fuiste vos, ignorá este mensaje y tu correo actual queda como está.</p>
```

## Invite User

**Asunto:**

```
Te invitaron a Dormetria
```

**Cuerpo:**

```html
<h2>Te invitaron a Dormetria</h2>
<p>Tu profesional te invitó a llevar tu diario de sueño en Dormetria.</p>
<p><a href="{{ .ConfirmationURL }}">Crear mi cuenta</a></p>
```

---

## Lo que el idioma NO arregla

Traducir las plantillas hace que el correo se entienda. **No hace que llegue.**
Son dos problemas distintos y conviene no confundirlos:

| Síntoma | Causa | Arreglo |
|---|---|---|
| Llega en inglés | Plantillas de fábrica | Las de arriba |
| No llega / va a spam | Remitente compartido de Supabase, sin SPF/DKIM de tu dominio | SMTP propio |

Mientras los correos salgan por el servidor compartido de Supabase, el
remitente no es dormetria.com y no hay firma de tu dominio: los filtros de
Gmail y Hotmail lo tratan como correo de un tercero hablando en tu nombre. Ese
es el motivo más probable de que a los pacientes de Eduardo Ruffa no les haya
llegado nada.

**SMTP propio** — *Project Settings → Authentication → SMTP Settings*. Cualquier
proveedor sirve (Resend, Postmark, SendGrid, Amazon SES). Hay que:

1. Verificar el dominio `dormetria.com` en el proveedor.
2. Cargar los registros **SPF** y **DKIM** que te dé, en el DNS de DonWeb.
3. Poner el host, puerto, usuario y contraseña en Supabase.
4. *Sender name*: **Dormetria**. *Sender email*: algo como
   `no-responder@dormetria.com`.

Recién con eso el correo sale firmado por tu dominio. Es media hora de trabajo
y es lo que mueve la aguja de verdad.

**El nombre del remitente**, aunque no hagas lo anterior: en *SMTP Settings*,
el campo *Sender name*. Si dice "Supabase Auth", el paciente recibe un correo
de alguien que no conoce.

**El idioma de los errores.** Los mensajes que devuelve Supabase Auth ("Invalid
login credentials", "Email not confirmed") son del servidor y vienen siempre en
inglés. Eso sí está resuelto del lado de la app: `dmAuthErrorMsg()` los traduce
antes de mostrarlos, y desde mod195 también los del flujo de recuperación de
contraseña, que era el único que todavía los mostraba crudos.

## Cómo verificar que quedó

Pedí un reset a una casilla tuya —mejor una de Gmail y otra de Hotmail, que son
las que usan tus pacientes— y revisá cuatro cosas:

1. Que el asunto esté en castellano.
2. Que el remitente diga **Dormetria** y la dirección sea de dormetria.com.
3. Que haya caído en Recibidos y no en Spam.
4. Que el enlace abra la pantalla de contraseña nueva y no la de inicio de
   sesión.

Si ya hiciste lo del SMTP, en Gmail: abrí el mail → los tres puntos → *Mostrar
original*. Tienen que decir **PASS** tanto SPF como DKIM. Si alguno dice FAIL,
falta un registro en el DNS.
