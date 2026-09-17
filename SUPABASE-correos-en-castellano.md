# Los correos de Supabase, en castellano

El mail de recuperación de contraseña **no lo manda la app**: lo manda Supabase
Auth con sus plantillas de fábrica, que vienen en inglés. No hay nada que
tocar en el código — hay que editarlas en el panel.

**Supabase → Authentication → Emails → Templates.** Hay una plantilla por tipo
de correo y cada una tiene asunto y cuerpo.

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

## Dos cosas más del mismo panel

**El nombre del remitente.** En *Project Settings → Authentication → SMTP
Settings*, el campo *Sender name*. Si dice "Supabase Auth", el paciente recibe
un correo de un remitente que no conoce y lo manda a spam. Tiene que decir
**Dormetria**.

**El idioma de los errores.** Los mensajes que devuelve Supabase Auth ("Invalid
login credentials", "Email not confirmed") son del servidor y vienen siempre en
inglés. Eso sí está resuelto del lado de la app: `dmAuthErrorMsg()` los traduce
antes de mostrarlos, y desde mod195 también los del flujo de recuperación de
contraseña, que era el único que todavía los mostraba crudos.

## Cómo verificar que quedó

Pedí un reset a una casilla tuya y revisá tres cosas: que el asunto esté en
castellano, que el remitente diga Dormetria, y que el enlace abra la pantalla
de contraseña nueva y no la de inicio de sesión.
