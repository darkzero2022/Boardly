# KanBoard — Team Task Management

A self-hosted, local-network Kanban board application for 16–50 users across multiple teams. Built like Asana — drag-and-drop boards, SLA tracking, Microsoft Teams integration, audit trails, and role-based access. No cloud dependency required.

---

## Screenshots

### Login Page
![Login](docs/screenshots/login.png)

Clean sign-in page supporting both local credentials and Microsoft SSO (Azure AD). Admin can enable/disable either method from settings.

### Workspaces Dashboard
![Workspaces](docs/screenshots/workspaces.png)

Workspace overview showing all boards with task counts per board. Create new workspaces and boards from here.

### Kanban Board
![Board](docs/screenshots/board.png)

Drag-and-drop Kanban board with columns (To Do, In Progress, Review, Done). Tasks show color-coded labels, SLA status indicators, and assignee avatars. Real-time updates via Socket.io — moves by one user appear instantly on all connected browsers.

### Task Detail Drawer
![Task Detail](docs/screenshots/task-detail.png)

Full task detail with priority, SLA deadline, assignee, reporter, labels, description, and tabs for Comments, Subtasks, and History (audit trail).

### Reports & Analytics
![Reports](docs/screenshots/reports.png)

Three report tabs: **Team Workload** (bar chart of tasks per user, color-coded by SLA status), **SLA Compliance** (on-time rate over time), **Burndown** (tasks created vs completed). All exportable to Excel.

### User Management
![Users](docs/screenshots/users.png)

Admin panel to add/edit users, assign roles (ADMIN / MANAGER / MEMBER), and assign to teams.

### Notification Settings
![Notifications](docs/screenshots/notifications.png)

Per-user notification preferences for in-app, email, Microsoft Teams alerts, and browser push. Admin controls which channels are available globally.

### SLA Policies
![SLA](docs/screenshots/sla.png)

Configure response/resolution time targets per priority level, per board. Escalation rules notify assignee → manager → admin at configurable thresholds.

---

## Features

| Feature | Description |
|---------|-------------|
| **Kanban Boards** | Drag-and-drop columns with real-time updates via Socket.io |
| **Task Engine** | Full CRUD, subtasks, priority levels, due dates, recurring tasks |
| **SLA Tracking** | Automatic deadlines by priority; AT_RISK / BREACHED indicators; cron escalation |
| **Labels** | Global color-coded labels, multiple per task |
| **Comments** | Threaded comments with `@mention` support |
| **File Attachments** | Upload files per task, stored locally |
| **Audit Log** | Full history of every task change, viewable in task drawer |
| **Notifications** | In-app bell, email (SMTP), browser push (VAPID), Teams webhooks |
| **Reports** | Team workload, SLA compliance, burndown — exportable to Excel |
| **MS Teams Integration** | Adaptive card notifications to Teams channels; bot commands |
| **MS Planner Sync** | Two-way sync via Graph API; conflict resolution with audit trail |
| **Role-Based Access** | ADMIN / MANAGER / MEMBER roles with granular permissions |
| **Auth** | Local credentials (bcrypt) + Microsoft SSO (Azure AD); admin-toggled |
| **LAN Access** | Binds to `0.0.0.0:3000` — accessible to all devices on the local network |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Custom Server | `tsx server.ts` — Next.js + Socket.io on same port |
| Database | SQLite (WAL mode) via Prisma ORM |
| Auth | NextAuth.js v5 beta — credentials + Microsoft Entra ID |
| Real-time | Socket.io |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| UI Components | Radix UI primitives + Tailwind CSS |
| Charts | Recharts |
| Excel Export | ExcelJS |
| Email | Nodemailer (SMTP) |
| Browser Push | web-push + VAPID |
| MS Integration | `@microsoft/microsoft-graph-client` |
| SLA Cron | node-cron (every 15 min) |

---

## Prerequisites

- **Node.js** 18.17 or later
- **npm** 9+ (install with `--legacy-peer-deps` due to NextAuth v5 beta peer deps)
- A Windows, macOS, or Linux machine on your local network

---

## Installation

### 1. Clone / download the project

```bash
git clone <your-repo-url> KanBoard
cd KanBoard
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because `next-auth@5.0.0-beta.25` has peer dependency conflicts with some packages.

### 3. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` — see the [Environment Variables](#environment-variables) section below.

At minimum, set a strong random secret:

```env
AUTH_SECRET="generate-with-openssl-rand-base64-32"
```

Generate one:
```bash
openssl rand -base64 32
```

### 4. Set up the database

Run the Prisma migration to create the SQLite schema:

```bash
DATABASE_URL="file:./kanboard.db" npx prisma migrate dev --name init
```

### 5. Seed default data

Creates the default team, 3 sample users, 1 workspace, 1 board, 8 global labels, and an SLA policy:

```bash
DATABASE_URL="file:./kanboard.db" npx tsx prisma/seed.ts
```

### 6. Start the development server

```bash
DATABASE_URL="file:./kanboard.db" npm run dev
```

The app starts on **http://localhost:3000** and is also accessible from any device on your LAN at **http://[your-machine-ip]:3000**.

---

## Default Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@kanboard.local` | `admin123` |
| Manager | `manager@kanboard.local` | `manager123` |
| Member | `member@kanboard.local` | `member123` |

> **Change these passwords immediately** after first login in a real deployment.

---

## Environment Variables

```env
# ── Database ───────────────────────────────────────────────────────────────
DATABASE_URL="file:./kanboard.db"

# ── NextAuth v5 ────────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"
AUTH_URL="http://localhost:3000"          # Change to http://[your-lan-ip]:3000 for LAN use

# ── Microsoft Azure AD (SSO) ───────────────────────────────────────────────
# Leave empty to disable Microsoft SSO login
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# ── Email (SMTP) ───────────────────────────────────────────────────────────
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="KanBoard <noreply@kanboard.local>"

# ── Browser Push (Web Push API) ────────────────────────────────────────────
# Generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@kanboard.local"

# ── Microsoft Teams ────────────────────────────────────────────────────────
# Fallback webhook; boards can override this in the Integrations settings
TEAMS_WEBHOOK_URL=""

# ── MS Graph API (Planner Sync) ────────────────────────────────────────────
GRAPH_CLIENT_ID=""
GRAPH_CLIENT_SECRET=""
GRAPH_TENANT_ID=""

# ── Server ─────────────────────────────────────────────────────────────────
PORT=3000
```

---

## LAN Access Setup

The server binds to `0.0.0.0:3000`, so it is automatically accessible on your local network.

1. Find your machine's local IP:
   - **Windows**: `ipconfig` → look for IPv4 Address (e.g., `192.168.1.100`)
   - **macOS/Linux**: `ip addr` or `ifconfig`

2. Update `.env.local`:
   ```env
   AUTH_URL="http://192.168.1.100:3000"
   ```

3. Share the URL with your team: `http://192.168.1.100:3000`

4. Ensure your firewall allows inbound connections on port 3000.

---

## Microsoft SSO Setup (Azure AD)

1. Go to [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**

2. Set the redirect URI:
   ```
   http://[your-server-ip]:3000/api/auth/callback/microsoft-entra-id
   ```

3. Under **Certificates & secrets**, create a new client secret.

4. Copy the values into `.env.local`:
   ```env
   AZURE_AD_CLIENT_ID="your-application-client-id"
   AZURE_AD_CLIENT_SECRET="your-client-secret-value"
   AZURE_AD_TENANT_ID="your-directory-tenant-id"
   ```

5. In KanBoard admin settings (**Settings → Integrations**), ensure "Microsoft SSO" is enabled.

> Users who sign in via Microsoft SSO are automatically provisioned with the MEMBER role. An admin can promote them afterward.

---

## Microsoft Teams Integration

### Channel Notifications (Incoming Webhook)

1. In Microsoft Teams, right-click the channel → **Connectors** → **Incoming Webhook** → **Configure**
2. Name it "KanBoard", copy the webhook URL
3. In KanBoard: **Settings → Integrations** → paste the webhook URL per board

Notifications are sent as Adaptive Cards when tasks are created, SLA breaches occur, or tasks are completed.

### Teams Bot (optional)

1. Register a bot in Azure Bot Framework (App Registration → Messaging Endpoint: `http://[ip]:3000/api/integrations/teams/bot`)
2. Add `AZURE_AD_CLIENT_ID` and `AZURE_AD_CLIENT_SECRET` to `.env.local`
3. Install the bot in your Teams channel

Bot commands: `create task [title]`, `assign [task-id] [user]`, `status [task-id]`

### Teams Tab (embed board in Teams)

1. Create a Teams App manifest pointing the tab URL to: `http://[ip]:3000/embed/board/[board-id]`
2. Upload the manifest via Teams Developer Portal or sideload it

---

## Microsoft Planner Two-Way Sync

1. Create an App Registration in Azure with **Graph API** permissions:
   - `Tasks.ReadWrite`
   - `Group.Read.All`

2. Fill in `.env.local`:
   ```env
   GRAPH_CLIENT_ID="your-graph-app-client-id"
   GRAPH_CLIENT_SECRET="your-graph-client-secret"
   GRAPH_TENANT_ID="your-tenant-id"
   ```

3. In KanBoard: **Settings → Integrations** → link a board to a Planner plan ID

KanBoard tasks sync to Planner on create/update. Planner changes sync back via Graph API webhook subscriptions. Conflict resolution uses last-write-wins with a full audit trail.

---

## Email Notifications Setup

1. Configure an SMTP server in `.env.local`:
   ```env
   SMTP_HOST="smtp.yourdomain.com"
   SMTP_PORT="587"
   SMTP_USER="noreply@yourdomain.com"
   SMTP_PASS="your-smtp-password"
   SMTP_FROM="KanBoard <noreply@yourdomain.com>"
   ```

2. In KanBoard: **Settings → Notifications** → enable "Email notifications" globally (Admin section at the bottom of the page)

---

## Browser Push Notifications Setup

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Add to `.env.local`:
   ```env
   VAPID_PUBLIC_KEY="your-public-key"
   VAPID_PRIVATE_KEY="your-private-key"
   VAPID_SUBJECT="mailto:admin@yourdomain.local"
   ```

3. Users enable "Browser push notifications" in **Settings → Notifications** and grant permission when prompted.

---

## Production Deployment

### Build

```bash
DATABASE_URL="file:./kanboard.db" npm run build
```

### Run in production

```bash
DATABASE_URL="file:./kanboard.db" NODE_ENV=production npm start
```

### Running as a Windows Service (optional)

Use [NSSM](https://nssm.cc/) or [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start "npm run start" --name kanboard --env DATABASE_URL="file:./kanboard.db"
pm2 save
pm2 startup
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed default data |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npx prisma migrate dev --name [name]` | Create a new migration |

All database commands require the `DATABASE_URL` prefix on Windows:
```bash
DATABASE_URL="file:./kanboard.db" npx prisma migrate dev
```

---

## Architecture

```
Browser / LAN clients
        │
        ▼
  HTTP :3000 (server.ts)
  ├── Next.js App Router (pages + API routes)
  └── Socket.io  (/socket.io)
        │
        ├── Prisma ORM ──► SQLite (kanboard.db, WAL mode)
        ├── NextAuth v5  ──► JWT sessions
        ├── node-cron   ──► SLA engine (every 15 min)
        ├── Nodemailer  ──► SMTP email
        ├── web-push    ──► Browser push
        └── Graph API   ──► MS Teams + Planner
```

### Key Files

| File | Purpose |
|------|---------|
| `server.ts` | Custom HTTP server: Next.js + Socket.io on same port |
| `lib/auth.ts` | NextAuth config: credentials + MS Entra ID, dynamic DB-driven provider toggle |
| `lib/db.ts` | Prisma client singleton with WAL mode |
| `lib/types.ts` | String union types (Role, Priority, SLAStatus, etc.) replacing SQLite-unsupported Prisma enums |
| `lib/sla/engine.ts` | SLA deadline calculator + cron escalation |
| `lib/notifications/dispatcher.ts` | Fan-out to in-app, email, Teams, browser push |
| `lib/integrations/planner/sync.ts` | MS Planner two-way Graph API sync |
| `middleware.ts` | Edge-compatible JWT auth guard (no Prisma) |
| `prisma/schema.prisma` | Full data model |
| `prisma/seed.ts` | Default seed data |

---

## Troubleshooting

### `/api/auth/...` returns 404
The server was likely restarted and the auth route failed to compile. **Restart the server** — this clears the Next.js compilation cache and recompiles all routes.

### `DATABASE_URL not found` when running Prisma CLI
On Windows, `.env.local` is not automatically loaded by the Prisma CLI. Prefix every Prisma command:
```bash
DATABASE_URL="file:./kanboard.db" npx prisma migrate dev
```

### Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### Socket.io not connecting
The Socket.io path is `/socket.io`. Ensure your reverse proxy (if any) forwards WebSocket upgrade headers. For direct LAN access, no proxy is needed.

### `--legacy-peer-deps` required
`next-auth@5.0.0-beta.25` has peer dependency conflicts. Always use:
```bash
npm install --legacy-peer-deps
```

---

## Roles & Permissions

| Action | MEMBER | MANAGER | ADMIN |
|--------|--------|---------|-------|
| View boards | ✓ | ✓ | ✓ |
| Create/edit tasks | ✓ | ✓ | ✓ |
| Delete tasks | — | ✓ | ✓ |
| Manage columns | — | ✓ | ✓ |
| Create workspaces/boards | — | ✓ | ✓ |
| Manage users | — | — | ✓ |
| Global settings | — | — | ✓ |
| Toggle auth providers | — | — | ✓ |
| Export reports | — | ✓ | ✓ |

---

## License

MIT — self-host freely, modify as needed.
