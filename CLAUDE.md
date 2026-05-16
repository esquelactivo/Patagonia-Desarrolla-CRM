# Patagonia Desarrolla CRM — Contexto de Proyecto

## Descripción General

CRM inmobiliario a medida para **Patagonia Desarrolla** (empresa constructora/inmobiliaria argentina). Gestiona propiedades, contactos, consultas (leads), pipeline de ventas, campañas de email, agenda, plantillas de WhatsApp y notificaciones. Todo el desarrollo se hace directamente desde sesiones de Claude Code — sin entorno local.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| ORM | Prisma 6 |
| Base de datos | PostgreSQL en Neon |
| Estilos | Tailwind CSS v4 |
| Auth | JWT + cookies httpOnly (`jsonwebtoken` + `bcryptjs`) |
| Email | Resend |
| CSV Import | papaparse |
| Deploy | Vercel |

---

## Repositorio y Ramas

- **Repo GitHub**: `esquelactivo/patagonia-desarrolla-crm`
- **Rama de desarrollo**: `claude/build-inmocrm-nextjs-jBfLj` → deploy en **Preview** de Vercel
- **Rama de producción**: `main` → deploy en **Production** de Vercel (usada por los agentes con datos reales)
- **Regla**: siempre desarrollar en `claude/build-inmocrm-nextjs-jBfLj`, nunca tocar `main` directamente

---

## Bases de Datos (Neon)

Hay **dos bases de datos separadas**:

| Entorno | Proyecto Neon | Variable de entorno en Vercel |
|---|---|---|
| Production (main) | `neon-citron-globe` | `NEON_DATABASE_URL` → Production |
| Preview (dev) | `patagonia-crm-dev` | `NEON_DATABASE_URL` → Preview/Development |

**Importante**: La variable en Prisma se llama `NEON_DATABASE_URL` (no `DATABASE_URL`). Esto es intencional porque Vercel Storage bloquea la edición de `DATABASE_URL` cuando está conectada como Integration. Al renombrarla, se puede asignar por separado a cada entorno en Vercel → Settings → Environment Variables.

**Schema se aplica automáticamente**: El script `build` en `package.json` ejecuta `prisma db push --skip-generate && next build`, por lo que cada deploy de Vercel aplica cambios del schema aditivos automáticamente. Los cambios destructivos (eliminar columnas/tablas) requieren atención.

---

## Variables de Entorno Necesarias en Vercel

```
NEON_DATABASE_URL          # Conexión a PostgreSQL (diferente por entorno)
JWT_SECRET                 # Secreto para firmar tokens JWT
META_WEBHOOK_VERIFY_TOKEN  # Token de verificación del webhook de Meta Ads
META_APP_SECRET            # App Secret de Meta para verificar firma HMAC
META_PAGE_ACCESS_TOKEN     # Page Access Token para fetchear datos del lead
RESEND_API_KEY             # API key de Resend para envío de emails
RESEND_FROM_EMAIL          # Email remitente (ej: no-reply@tudominio.com)
```

---

## Autenticación

- JWT en cookie httpOnly `session` (7 días de duración)
- Cookie JS-legible `user_role` para que el Sidebar muestre ítems de admin
- Cookie JS-legible `user_name` para mostrar nombre en UI
- Middleware en `src/middleware.ts` protege todas las rutas excepto `/login` y `/api/*`
- **Auto-seed**: Si no hay usuarios en la DB, el login crea automáticamente `admin@inmobiliaria.com` / `admin123`. Útil para inicializar una DB nueva en Preview.
- Roles: `ADMIN` (acceso total) y `AGENT` (acceso restringido — sin Usuarios ni Configuración)

---

## Estructura de Archivos

```
src/
├── app/
│   ├── (dashboard)/          # Grupo de rutas con layout compartido
│   │   ├── layout.tsx        # Usa DashboardShell
│   │   ├── dashboard/        # Métricas generales
│   │   ├── propiedades/      # CRUD propiedades
│   │   ├── contactos/        # CRUD contactos
│   │   ├── consultas/        # Leads/inquiries (sección principal)
│   │   ├── pipeline/         # Kanban de deals
│   │   ├── campanias/        # Campañas de email con Resend
│   │   ├── calendario/       # Vista calendario de actividades
│   │   ├── plantillas-wa/    # Plantillas de WhatsApp
│   │   ├── agenda/           # Agenda personal del agente
│   │   ├── notificaciones/   # Notificaciones de actividades compartidas
│   │   ├── perfil/           # Perfil del usuario logueado
│   │   ├── usuarios/         # Gestión de usuarios (solo ADMIN)
│   │   └── configuracion/    # Reglas de asignación automática (solo ADMIN)
│   ├── api/
│   │   ├── auth/             # login, logout, me
│   │   ├── inquiries/        # CRUD consultas
│   │   ├── contacts/         # CRUD contactos
│   │   ├── properties/       # CRUD propiedades
│   │   ├── deals/            # CRUD deals
│   │   ├── activities/       # CRUD actividades + mark-seen
│   │   ├── campaigns/        # CRUD campañas + send + recipients
│   │   ├── users/            # CRUD usuarios (solo ADMIN)
│   │   ├── wa-templates/     # CRUD plantillas WA
│   │   ├── assignment-rules/ # Reglas de asignación automática
│   │   └── webhooks/
│   │       ├── meta/         # Recibe leads de Meta Ads Lead Forms
│   │       └── resend/       # Tracking de apertura/clics de emails
│   ├── login/
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── DashboardShell.tsx  # Wrapper con sidebar + header + History API
│   │   ├── Header.tsx          # Header con notificaciones, avatar, back arrow
│   │   └── Sidebar.tsx         # Navegación lateral (collapsable en desktop, off-canvas en mobile)
│   └── ui/
│       ├── Badge.tsx, Button.tsx, Card.tsx, Input.tsx
│       ├── Modal.tsx, Select.tsx, Table.tsx, Textarea.tsx
├── lib/
│   ├── prisma.ts    # Singleton de PrismaClient
│   ├── auth.ts      # signToken / verifyToken
│   └── getUser.ts   # Helper para leer usuario desde cookie en Server Components
├── middleware.ts
└── types/index.ts   # Interfaces TypeScript de todos los modelos
```

---

## Schema de Base de Datos (Prisma)

Modelos principales:

- **User**: `id, email, name, password, role (ADMIN|AGENT), avatar`
- **Property**: `id, title, type, operation, status, price, currency, address, city, neighborhood, bedrooms, bathrooms, area, images[], features[]`
- **Contact**: `id, name, email, phone, type (COMPRADOR|VENDEDOR|INQUILINO|PROPIETARIO), notes`
- **Inquiry**: `id, name, email, phone, message, source, channel, adName, formId, city, province, propertyId, contactId, status, assignedTo`
- **Deal**: `id, title, contactId, propertyId, stage (VISITA|OFERTA|RESERVA|CIERRE), status (ACTIVA|GANADA|PERDIDA), value, notes`
- **Activity**: `id, title, type (VISITA|LLAMADA|REUNION|SEGUIMIENTO|RECORDATORIO), date, done, notes, contactId, propertyId, dealId, inquiryId, userId`
- **ActivityParticipant**: relación muchos-a-muchos Activity↔User con campo `notified`
- **Campaign**: `id, title, type (NEWSLETTER|FLYER), subject, content, status (BORRADOR|ENVIADA|PROGRAMADA), sentAt`
- **CampaignRecipient**: tracking por contacto: `emailId, sentAt, opened, openedAt, clicked, clickedAt, error`
- **WaTemplate**: `id, name, message, formName` (formName opcional para asociar a un formulario de Meta)
- **AssignmentRule**: `formName (unique), userId` — asigna automáticamente consultas de un formulario a un agente

---

## Estados de Inquiry (Consultas)

Los estados actuales son:

```
SIN_CONTACTAR → ESPERANDO_RESPUESTA → CONTACTO_ESTABLECIDO → EN_SEGUIMIENTO → DESCARTADA / ARCHIVADA
```

**Compatibilidad hacia atrás**: Registros viejos en DB pueden tener los estados `NUEVA`, `CONTACTADA`, `CALIFICADA`. La función `normalizeStatus()` en `consultas/page.tsx` los mapea al estado nuevo equivalente para mostrar en el tab correcto:

```ts
const normalizeStatus = (s: string) => ({
  NUEVA: 'SIN_CONTACTAR',
  CONTACTADA: 'ESPERANDO_RESPUESTA',
  CALIFICADA: 'EN_SEGUIMIENTO',
}[s] || s)
```

---

## Integración Meta Ads (Webhook)

**Archivo**: `src/app/api/webhooks/meta/route.ts`

Flujo:
1. Meta envía un POST al webhook cuando llega un nuevo lead
2. Se verifica la firma HMAC con `META_APP_SECRET`
3. Se llama a la Graph API con `META_PAGE_ACCESS_TOKEN` para obtener los datos del lead
4. Se mapean los campos: `full_name/nombre → name`, `email`, `phone_number/telefono/celular → phone`, `ad_name → source + adName`, `form_id → formId`
5. El resto de campos van al campo `message` como texto plano
6. **Limitación**: `city` y `province` solo se capturan correctamente vía importación CSV, no vía webhook (quedan en `message`)
7. Token de verificación GET: `META_WEBHOOK_VERIFY_TOKEN`

**Importación CSV** (`consultas/page.tsx`): mapea columnas de Meta Ads export (inglés y español), detecta delimitador automáticamente, campos no reconocidos van a `message`.

---

## Comportamientos Clave de UI

### Mobile
- **Sidebar**: off-canvas, se abre con el botón hamburger (derecha del header). Se cierra con el botón de retroceso del celular gracias a History API (`pushState`/`popstate` en `DashboardShell.tsx`).
- **Back arrow**: aparece en el header (izquierda del título) en todas las páginas excepto `/dashboard`, solo en mobile (`md:hidden`).
- **Notificaciones dropdown**: usa `fixed right-4 top-16` (no `absolute`) para evitar que se salga del viewport en mobile.
- **Dashboard métricas**: grid de 4 columnas en mobile estilo calculadora (`grid-cols-4`), layout horizontal en desktop.
- **Consultas mobile header**: título + contador en columna, luego grid de 3 botones (Nueva consulta, Plantillas WA, Importar CSV).

### Header (`Header.tsx`)
- Campanita de notificaciones con badge rojo con conteo de consultas sin contactar
- Polling cada 60 segundos para nuevas consultas y actividades compartidas
- Al abrir el dropdown, marca todas las notificaciones como vistas (localStorage + API)
- Avatar → link a `/perfil`
- Muestra nombre del usuario logueado (fetch a `/api/auth/me`)

### Sidebar (`Sidebar.tsx`)
- Collapsable en desktop (modo ícono solo)
- Logo completo expandido, ícono solo colapsado
- Items de admin (Usuarios, Configuración) solo visibles si `user_role` cookie = `ADMIN`
- Se cierra automáticamente al navegar (mobile)

---

## Campañas y Email (Resend)

- Campañas de tipo `NEWSLETTER` (email HTML/texto) y `FLYER` (imagen adjunta)
- Envío real vía Resend SDK a lista de contactos
- Webhook de Resend en `/api/webhooks/resend` para tracking de opens/clicks
- `CampaignRecipient` guarda `emailId` (de Resend) para correlacionar eventos del webhook

---

## Configuración y Asignación Automática

- Solo ADMIN puede crear `AssignmentRule`
- Cada regla asocia un `formName` (nombre del formulario de Meta) con un agente
- Cuando llega un lead vía webhook cuyo `formId` o `adName` coincide con una regla, se asigna automáticamente al agente indicado

---

## Tareas Pendientes / Ideas Futuras

- **Resend setup completo**: Verificar dominio en Resend, configurar las 4 env vars en Vercel, testear webhook de tracking
- **Preview con URL estable**: En Vercel → Settings → Domains, agregar un subdominio `.vercel.app` y asignarlo a la rama de preview (gratis, sin comprar dominio)
- **Campos faltantes de Meta Lead Forms**: `street_address`, `state`, `country`, `post_code`/`zip_code` no tienen columna propia en el schema de `Inquiry`. Actualmente caen en `message`. Si se necesitan como campos filtrables, habría que agregarlos al schema y al webhook.
- **WhatsApp number vs Phone number**: Se recomienda usar el campo **WhatsApp number** en los formularios de Meta Ads (mejor calidad de dato en Argentina, compatible con las Plantillas WA del CRM).
- **City/Province en webhook**: Actualmente solo se capturan vía CSV. Si Meta envía esos campos, caen en `message`. Se podría mapear `city` y `province` en `fetchLeadFromMeta()`.

---

## Credenciales de Acceso (Solo para testing)

**Preview** (DB vacía): Si la DB de preview no tiene usuarios, el primer login los crea:
- Email: `admin@inmobiliaria.com`
- Password: `admin123`

**Production**: Usar las credenciales reales del admin de Patagonia Desarrolla.

---

## Comandos Útiles

```bash
# Ver estado del repo
git status
git log --oneline -10

# Push al branch de desarrollo
git push -u origin claude/build-inmocrm-nextjs-jBfLj

# El schema se aplica automáticamente en cada deploy de Vercel.
# No se puede correr prisma db push localmente desde esta sesión (sin acceso a red externa).
```

---

## Notas de Arquitectura

- **No hay entorno local**: Todo el desarrollo se hace desde sesiones de Claude Code en Vercel. No se puede ejecutar `npm run dev` ni `prisma db push` localmente — los cambios se testean vía deploys de Preview.
- **Prisma client generado en build**: `postinstall` corre `prisma generate`. En esta sesión de Claude, el cliente no está generado localmente, por eso `tsc` muestra errores de tipos de Prisma — esto es normal y no indica bugs reales.
- **Server Components + Client Components**: Las páginas del dashboard mezclan ambos. Las páginas que necesitan interactividad usan `'use client'`. El dashboard principal (`/dashboard/page.tsx`) es un Server Component con `export const dynamic = 'force-dynamic'`.
- **Cookies para auth en middleware**: El middleware de Next.js corre en Edge Runtime y solo puede verificar la existencia de la cookie `session`, no su validez JWT (el JWT_SECRET no está disponible en Edge sin configuración adicional). La validación real del JWT ocurre en cada API route y en `getUser.ts`.
