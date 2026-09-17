# La Granja del Pollo — Control de negocio de huevos

Aplicación web para manejar el inventario, las ventas y las ganancias del negocio.
Todo se mide en **cartones de 30 huevos**.

Funciona en celular, tablet y computadora. Se sube gratis a Vercel y guarda los
datos en Supabase, así que nada se borra al cerrar la página.

---

## Antes de empezar

Necesitas tres cosas, todas gratis:

| Qué | Para qué | Dónde |
|---|---|---|
| Cuenta de GitHub | Guardar el código | github.com |
| Cuenta de Supabase | Base de datos y contraseñas | supabase.com |
| Cuenta de Vercel | Publicar la página en internet | vercel.com |

Puedes crear las tres con el mismo correo. **Consejo:** crea primero la de GitHub,
porque las otras dos te dejan entrar con ese mismo usuario y te ahorras contraseñas.

El proceso completo toma entre 20 y 30 minutos la primera vez. No necesitas saber
programar, pero sí seguir los pasos en orden.

---

## Paso 1 — Sube el código a GitHub

1. Entra a [github.com](https://github.com) y crea tu cuenta si no la tienes.
2. Arriba a la derecha, toca el **+** → **New repository**.
3. En *Repository name* escribe `la-granja-del-pollo`.
4. Marca **Private** (así solo tú ves el código).
5. Toca **Create repository**.
6. En la pantalla que aparece, busca el enlace **uploading an existing file**.
7. Descomprime el archivo `la-granja-del-pollo.zip` en tu computadora y arrastra
   **todo el contenido de la carpeta** a esa pantalla de GitHub.
8. Abajo, toca **Commit changes**.

> **Importante:** arrastra lo que está *dentro* de la carpeta, no la carpeta misma.
> En la raíz del repositorio debe verse el archivo `package.json`. Si ves una sola
> carpeta llamada `la-granja-del-pollo`, entra a ella, borra todo y vuelve a subir.

---

## Paso 2 — Crea la base de datos en Supabase

### 2.1 Crear el proyecto

1. Entra a [supabase.com](https://supabase.com) → **Start your project**.
2. Entra con GitHub.
3. Toca **New project**.
4. Llénalo así:
   - **Name:** `la-granja-del-pollo`
   - **Database Password:** genera una y **guárdala en un lugar seguro**. No la vas
     a usar en esta aplicación, pero la necesitarás si algún día quieres entrar a
     la base de datos directamente.
   - **Region:** elige la más cercana. Para República Dominicana, `East US (North Virginia)`.
5. Toca **Create new project** y espera uno o dos minutos.

### 2.2 Crear las tablas

1. En el menú de la izquierda, toca **SQL Editor**.
2. Toca **New query**.
3. Abre el archivo `supabase/schema.sql` del proyecto con el Bloc de notas,
   **copia todo** y pégalo en el editor.
4. Toca **Run** (o Ctrl+Enter).
5. Debe decir *Success. No rows returned*. Eso está bien: significa que creó todo.

Esto crea las tablas de inventario, ventas y usuarios, y sobre todo las **reglas de
seguridad**: un vendedor no puede leer los costos ni las ganancias ni aunque intente
entrar por la puerta de atrás.

### 2.3 Ajustar la autenticación

1. Menú izquierdo → **Authentication** → **Sign In / Providers** (en versiones
   anteriores se llama *Providers*).
2. Busca **Email** y ábrelo.
3. **Desactiva** la opción *Confirm email*.
   Esto evita tener que confirmar cada cuenta por correo. Como tú creas a mano los
   usuarios de tus vendedores, no hace falta.
4. Guarda.

### 2.4 Copiar tus llaves

1. Menú izquierdo → **Project Settings** (el engranaje) → **API Keys**.
2. Vas a copiar **tres valores**. Pégalos en el Bloc de notas por ahora:

   - **Project URL** → algo como `https://abcdefghijk.supabase.co`
   - **anon public** → un texto larguísimo que empieza con `eyJ...`
   - **service_role** → otro texto largo. Está oculto; toca *Reveal* para verlo.

> **La llave `service_role` es la llave maestra de tu negocio.** No la compartas con
> nadie, no la pongas en un chat, no la subas a GitHub. En esta aplicación solo vive
> en el servidor de Vercel, nunca llega al navegador de nadie.

---

## Paso 3 — Publica la aplicación en Vercel

1. Entra a [vercel.com](https://vercel.com) → **Sign Up** → entra con GitHub.
2. Toca **Add New...** → **Project**.
3. Busca `la-granja-del-pollo` en la lista y toca **Import**.
4. Antes de desplegar, abre la sección **Environment Variables** y agrega las tres
   variables, una por una (nombre exacto, respetando mayúsculas):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | tu Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu llave `anon public` |
   | `SUPABASE_SERVICE_ROLE_KEY` | tu llave `service_role` |

5. Toca **Deploy** y espera dos o tres minutos.
6. Cuando termine, Vercel te da una dirección tipo
   `https://la-granja-del-pollo.vercel.app`. Esa es tu aplicación.

> Si el despliegue falla, casi siempre es una variable mal copiada (un espacio de
> más al principio o al final). Ve a **Settings → Environment Variables**, corrígela,
> y luego en **Deployments** toca los tres puntos del último intento → **Redeploy**.

---

## Paso 4 — Crea tu cuenta de administrador

1. Abre tu dirección de Vercel y agrégale `/registro` al final:
   `https://la-granja-del-pollo.vercel.app/registro`
2. Llena tu nombre, tu correo y una contraseña de al menos 8 caracteres.
3. Toca **Crear cuenta**.

Esta pantalla **solo funciona una vez**. La primera cuenta que se crea queda como
administrador; después la página se cierra sola. A partir de ahí, los vendedores se
crean desde el módulo **Usuarios** dentro de la aplicación.

### Cierra el registro público (recomendado)

Para que nadie más pueda crearse una cuenta por su cuenta:

1. Supabase → **Authentication** → **Sign In / Providers** → **Email**.
2. Desactiva **Allow new users to sign up**.
3. Guarda.

Tú vas a seguir pudiendo crear vendedores desde Usuarios: esa función usa la llave
de servicio y no pasa por el registro público.

---

## Paso 5 — Configura tu negocio

Entra a la aplicación y, en este orden:

1. **Inventario → Precios y avisos.** Pon el precio de venta por cartón, cada cuántos
   cartones quieres que te avise de stock bajo, y el símbolo de moneda (viene `RD$`).
2. **Inventario → Registrar entrada de mercancía.** Mete tu primera compra: cuántos
   cartones y a qué costo cada uno.
3. **Ventas.** Ya puedes vender. El stock baja solo.

Sin al menos una entrada de mercancía y un precio de venta, la aplicación no deja
registrar ventas. Es a propósito: sin esos dos datos la ganancia no se puede calcular.

---

## Cómo se calculan las cosas

**Stock disponible** = todos los cartones que han entrado − todos los cartones vendidos.

**Costo promedio por cartón** = promedio ponderado de todas tus entradas.
Si compraste 100 cartones a RD$200 y luego 150 a RD$195, el costo promedio es
RD$197 (no RD$197.50: pesa más la compra de 150).

**Ganancia de una venta** = cartones × (precio de venta − costo promedio del momento).

El precio y el costo se **congelan** en cada venta. Si mañana subes el precio, tus
ventas de ayer siguen mostrando lo que realmente cobraste ese día.

---

## Los dos roles

| | Administrador | Vendedor |
|---|---|---|
| Registrar ventas | Sí | Sí |
| Ver el stock disponible | Sí | Sí |
| Ver historial de ventas | Todas | Solo las suyas |
| Ver costos y ganancias | Sí | **No** |
| Entradas de mercancía | Sí | No |
| Reportes | Sí | No |
| Crear usuarios | Sí | No |

El vendedor no ve la ganancia ni siquiera en sus propias ventas.

---

## Cómo está protegido

Tu punto sobre la seguridad tiene cuatro capas, no solo botones escondidos:

1. **Antes de cargar la página.** El middleware revisa el rol en el servidor. Si un
   vendedor escribe `/reportes` en la barra del navegador, lo devuelve a Inicio sin
   llegar a cargar nada.
2. **Al construir la página.** Cada pantalla de administrador vuelve a verificar el
   rol en el servidor antes de dibujarse.
3. **En la base de datos.** Las políticas de Postgres (RLS) impiden que un vendedor
   lea la tabla de entradas de mercancía, que es donde viven los costos. Y las
   columnas `costo_carton` y `ganancia` de la tabla de ventas están revocadas a nivel
   de columna: ni llamando a la API directamente se pueden leer.
4. **Al registrar una venta.** El precio y el costo los pone el servidor, no el
   navegador. Nadie puede inventarse un precio desde el celular.

Además:

- Las contraseñas las guarda Supabase cifradas con bcrypt. Nunca en texto plano, y
  ni tú puedes verlas.
- Un vendedor no puede ascenderse a administrador: hay un disparador en la base de
  datos que lo bloquea.
- Siempre debe quedar al menos un administrador activo. El sistema no te deja
  quedarte sin acceso.
- La sesión se cierra sola después de 30 minutos sin actividad.

---

## Preguntas frecuentes

**¿Cuánto cuesta?**
Nada, para un negocio de este tamaño. El plan gratuito de Vercel y el de Supabase
sobran de lejos.

**Supabase pausa proyectos gratuitos que no se usan.**
Si pasas una semana entera sin abrir la aplicación, Supabase puede pausar el
proyecto. Se reactiva desde el panel de Supabase con un botón y no se pierde nada.
Si la usas a diario, no te va a pasar.

**¿Cómo agrego un vendedor?**
Usuarios → Agregar usuario. Le pones nombre, correo, una contraseña temporal y el
rol. Le pasas esos datos una vez y él la cambia desde su perfil.

**Olvidé mi contraseña de administrador.**
Supabase → Authentication → Users → busca tu correo → los tres puntos →
*Send password recovery* o *Reset password*.

**¿Puedo cambiar el precio de venta?**
Sí, cuando quieras, en Inventario. Se aplica a las ventas nuevas; las anteriores no
se tocan.

**Me equivoqué en una venta.**
Solo el administrador puede anularla, desde el historial en Ventas. Al anularla los
cartones vuelven al inventario automáticamente.

**Quiero cambiar algo del código.**
Editas el archivo en GitHub y Vercel vuelve a publicar solo, en un par de minutos.

**¿Y si quiero un dominio propio?**
Vercel → tu proyecto → Settings → Domains. Compras el dominio aparte (unos US$12 al
año) y lo conectas ahí.

---

## Si quieres trabajar en tu computadora

Solo si algún día quieres modificar el código localmente. Necesitas Node.js 18 o superior.

```bash
npm install
cp .env.example .env.local   # y pega tus llaves de Supabase
npm run dev
```

Abre `http://localhost:3000`.

---

## Qué hay dentro del proyecto

```
app/
  (panel)/        Las pantallas de adentro: inicio, ventas,
                  inventario, reportes, usuarios, perfil
  login/          Entrada
  registro/       Creación del primer administrador (se cierra sola)
  api/admin/      Creación y borrado de usuarios (solo servidor)
components/       Navegación, tarjetas, gráficas
lib/              Conexión con Supabase y formato de números
supabase/
  schema.sql      La base de datos completa
middleware.js     El portero: revisa sesión y rol en cada petición
public/           El logo
```

---

Hecho para **La Granja del Pollo**. Cartón de 30 unidades.
