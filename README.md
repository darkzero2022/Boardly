<div align="center">

<img src="https://img.shields.io/badge/version-5.0-6366f1?style=for-the-badge" alt="Version 5.0" />

# Boardly

### Self-hosted team task management — built for your network, not the cloud

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A full-featured Kanban application for teams of any size. Drag-and-drop boards, SLA tracking, swimlanes, time tracking, real-time collaboration, two-factor authentication, custom fields, and Microsoft 365 integration — all running on your own server with zero cloud dependency.

[Quick Start](#quick-start) · [Features](#features) · [Screenshots](#screenshots) · [Configuration](#environment-variables) · [Deployment](#production-deployment) · [Changelog](#changelog)

</div>

---

## Screenshots

<div align="center">

**Sign in**

<img src="public/screenshots/05-login.png" alt="Boardly login page" width="480" />

**Workspaces dashboard**

<img src="public/screenshots/01-workspaces.png" alt="Workspaces dashboard" width="720" />

**Kanban board** — drag-and-drop columns, priority badges, WIP limits, real-time updates

<img src="public/screenshots/02-kanban-board.png" alt="Kanban board view" width="720" />

**⌘K Command palette** — search tasks, boards, and comments instantly

<img src="public/screenshots/04-search-palette.png" alt="Command palette" width="720" />

**Two-Factor Authentication setup** — scan QR code with any authenticator app

<img src="public/screenshots/03-2fa-setup.png" alt="2FA QR code setup" width="720" />

**Integrations** — outbound webhooks with HMAC signing, Teams, and Planner sync

<img src="public/screenshots/06-integrations.png" alt="Integrations settings" width="720" />

</div>

---

## What's New in v5.0

> **The Security & Power Update** — 2FA, Viewer role, Timeline view, outbound webhooks, CSV import, and custom fields.

| | Feature | Description |
|---|---|---|
| 🔒 | **Two-Factor Authentication** | TOTP-based 2FA (Google Authenticator, Authy). QR code setup, 6-digit login step, disable flow — per user in Security settings |
| 👁 | **Viewer Role** | New read-only role. Viewers see boards and tasks but all write operations are blocked at the API level (403) and hidden in the UI |
| 📅 | **Timeline / Gantt View** | Horizontal Gantt chart per board. Tasks rendered as priority-colored bars from creation date to due date, grouped by column, with a live today indicator |
| 🔔 | **Outbound Webhooks** | Send HTTP POST events (`task.created`, `task.moved`, `task.updated`, `task.completed`, `comment.added`) to any URL. Optional HMAC-SHA256 signature, per-event filtering, test button |
| 📥 | **CSV Import** | Import tasks from a spreadsheet. Column-mapping dialog, 5-row preview, bulk insert with result summary (imported / skipped / errors) |
| 🗃 | **Custom Fields** | Per-board field definitions: Text, Number, Date, Dropdown, Checkbox. Values saved per task with auto-save on change. Manage fields in board settings |
| ⌘K | **Command Palette** | Global search upgraded to a full modal command palette (⌘K / Ctrl+K). Results grouped by Tasks / Boards / Comments with arrow-key navigation |
| 🎯 | **Bulk Set Priority** | New bulk action: select multiple tasks → set priority for all in one click |

---

## Features

### 🗂 Kanban Boards

| Feature | Description |
|---|---|
| Drag-and-drop | Smooth DnD via `@dnd-kit` — reorder tasks and move between columns |
| Multiple workspaces | Organize boards by team, project, or department |
| Column management | Create, rename (double-click), reorder, and color columns |
| WIP limits | Max task count per column — orange warning at 80%, red at 100% |
| Custom fields | Add Text / Number / Date / Dropdown / Checkbox fields to any board |

### 👁 Views

| View | Description |
|---|---|
| **Kanban** | Classic column board with real-time drag-and-drop |
| **Calendar** | Monthly calendar showing tasks by due date, color-coded by priority |
| **Timeline** | Horizontal Gantt chart — tasks as bars from creation to due date, grouped by column |
| **Swimlanes** | Group tasks within columns by Assignee, Priority, or Label |

### ✅ Task Management

| Feature | Description |
|---|---|
| Rich task drawer | Description, assignee, labels, due date, priority, subtasks, comments, custom fields, full history |
| Subtasks | Nested hierarchy with independent tracking |
| Labels | Color-coded labels, multiple per task |
| Task dependencies | Blocks / blocked-by relationships with circular dependency detection |
| Custom fields | Per-board fields (Text, Number, Date, Dropdown, Checkbox) with auto-save |
| Task cloning | Duplicate any task with one click |
| File attachments | Upload files per task, stored on server disk |
| Task watchers | Watch any task to receive all its notifications |
| Time tracking | Log minutes with notes per task; total displayed in drawer tab |
| Recurring tasks | Auto-clone daily / weekly / monthly via scheduled cron |

### 🚀 Productivity

| Feature | Description |
|---|---|
| Global search (⌘K) | Command palette — instant search across tasks, comments, boards with arrow-key navigation |
| CSV import | Import tasks from a CSV file with column mapping and preview |
| Bulk operations | Multi-select tasks → move, reassign, set priority, add label, or delete |
| Keyboard shortcuts | `?` overlay — `N` new task, `B` bulk, `1/2/3` switch views, `Esc` close |
| Board templates | Save any board as a template, create new boards from it |
| Task templates | Reusable task starters insertable from the New Task dialog |
| My Dashboard | Personal view — stats, my tasks by priority, @mentions, activity feed |

### 🔔 SLA & Automation

| Feature | Description |
|---|---|
| SLA engine | Per-board policies (hours by priority) with auto-calculated deadlines |
| SLA escalation | Configurable escalation steps — assignee → manager → admin |
| Audit trail | Full history of every field change on every task |
| Recurring scheduler | Hourly cron clones recurring tasks on schedule |
| Outbound webhooks | Fire HTTP POST events to external systems on task/comment activity |

### 🤝 Collaboration

| Feature | Description |
|---|---|
| Real-time updates | Socket.io — moves, new tasks, and comments appear instantly for all users |
| Comments & @mentions | Threaded comments; @mention a user to notify them |
| Notifications | In-app bell, branded HTML email (SMTP), browser push (VAPID) |
| Task watchers | Subscribe to any task for instant notifications on every change |

### 🔐 Authentication & Security

| Feature | Description |
|---|---|
| Local accounts | Email + bcrypt password — admin controls who can sign up |
| LDAP / Active Directory | Corporate directory login — AD, OpenLDAP, FreeIPA. Auto-provisions users on first login |
| Microsoft SSO | Azure AD / Entra ID OAuth — admin can enable/disable per provider |
| Two-factor authentication | TOTP 2FA (Google Authenticator, Authy). QR code setup in Security settings |
| Viewer role | Read-only access — sees everything, can change nothing |

### 🏢 Microsoft 365 Integration

| Feature | Description |
|---|---|
| Teams webhooks | Post task events to Teams channels via Incoming Webhook |
| Teams bot | `create task`, `assign`, `status [id]` commands |
| Teams tab | Embed any board as a Teams tab |
| Planner two-way sync | Sync tasks with Microsoft Planner via Graph API |

### 📋 Admin & Reporting

| Feature | Description |
|---|---|
| Setup wizard | First-run guided setup — workspace name, mode, admin account |
| Role-based access | ADMIN / MANAGER / MEMBER / VIEWER with per-board overrides |
| User management UI | Change roles, reset passwords, delete users — no DB editing required |
| Reports | Workload, SLA compliance, burndown — with date presets and solo/team toggle |
| Excel export | Export any report to a formatted `.xlsx` |
| Dark mode | Full dark theme, persisted per user |
| Board embed | Embed any board as an iframe |
| Outbound webhooks | CRUD webhook management with test endpoint in Settings → Integrations |
| Custom field manager | Add / delete per-board custom fields in board settings |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) App Router + custom HTTP server |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) |
| Database | SQLite · PostgreSQL · MySQL (via Prisma) |
| ORM | [Prisma 5](https://prisma.io) |
| Auth | [NextAuth v5](https://authjs.dev) — credentials + LDAP + Azure AD |
| 2FA | [otplib](https://github.com/yeojz/otplib) — TOTP (RFC 6238) |
| Real-time | [Socket.io](https://socket.io) |
| Drag & Drop | [@dnd-kit](https://dndkit.com) |
| Charts | [Recharts](https://recharts.org) |
| CSV parsing | [PapaParse](https://www.papaparse.com) |
| Scheduling | [node-cron](https://github.com/node-cron/node-cron) |
| Email | [Nodemailer](https://nodemailer.com) |

---

## Quick Start

**Prerequisites:** Node.js 18+, Git

### Windows
```bat
git clone https://github.com/darkzero2022/Boardly.git
cd Boardly
setup.bat
start.bat
```

### Linux / macOS
```bash
git clone https://github.com/darkzero2022/Boardly.git
cd Boardly
chmod +x setup.sh start.sh
./setup.sh
./start.sh
```

The setup script will:
1. Check Node.js version
2. Install all dependencies
3. Ask you to choose a database (SQLite / PostgreSQL / MySQL)
4. Ask whether to enable LDAP (optional)
5. Generate `.env.local` with a random auth secret
6. Run database migrations

**On first launch**, the app detects a fresh database and walks you through a guided setup wizard to create your admin account and workspace. No default credentials, no seed scripts.

---

## Database Options

The setup script walks you through this interactively. See **[docs/database-setup.md](docs/database-setup.md)** for connection pooling, backups, HA, and migrating SQLite → PostgreSQL.

| Database | Best for | Example connection string |
|---|---|---|
| **SQLite** (default) | ≤ 30 users, single server, zero config | `file:./boardly.db` |
| **PostgreSQL** | 30–500+ users, HA, cloud | `postgresql://user:pass@host:5432/boardly` |
| **MySQL / MariaDB** | Existing MySQL infrastructure | `mysql://user:pass@host:3306/boardly` |

Managed cloud options: Supabase, Neon, Railway, AWS RDS, PlanetScale.

---

## Environment Variables

Copy `.env.local.example` to `.env.local`, or let the setup script generate it automatically.

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | Database connection string |
| `AUTH_SECRET` | Random secret for NextAuth (auto-generated by setup) |
| `AUTH_URL` | Full URL of the app, e.g. `http://192.168.1.10:3000` |

### LDAP / Active Directory

| Variable | Description |
|---|---|
| `LDAP_URI` | LDAP server URI, e.g. `ldap://dc.company.com:389` — leave blank to disable |
| `LDAP_BASE_DN` | Base DN, e.g. `dc=company,dc=com` |
| `LDAP_BIND_DN` | Service account DN for searching (leave blank for anonymous bind) |
| `LDAP_BIND_PASSWORD` | Service account password |
| `LDAP_USER_FILTER` | Search filter — default covers `sAMAccountName`, `uid`, `userPrincipalName` |
| `LDAP_TLS_REJECT_UNAUTHORIZED` | Set `false` for self-signed certs. Default: `true` |

### Microsoft SSO

| Variable | Description |
|---|---|
| `AZURE_AD_CLIENT_ID` | Azure App Registration client ID — leave blank to disable |
| `AZURE_AD_CLIENT_SECRET` | Client secret |
| `AZURE_AD_TENANT_ID` | Directory (tenant) ID |

### Notifications & Email

| Variable | Description |
|---|---|
| `SMTP_HOST` | SMTP server hostname — leave blank to disable email |
| `SMTP_PORT` | Default: `587` |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials |
| `SMTP_FROM` | From address, e.g. `Boardly <noreply@boardly.local>` |
| `VAPID_PUBLIC_KEY` | Browser push public key — generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Browser push private key |

### Microsoft 365 Integration

| Variable | Description |
|---|---|
| `TEAMS_WEBHOOK_URL` | Teams Incoming Webhook URL — leave blank to disable |
| `GRAPH_CLIENT_ID` | MS Graph app ID for Planner sync |
| `GRAPH_CLIENT_SECRET` | MS Graph client secret |
| `GRAPH_TENANT_ID` | MS Graph tenant ID |

---

## Two-Factor Authentication Setup

2FA is configured per user in **Settings → Security**.

1. Go to **Settings → Security** → click **Enable Two-Factor Authentication**
2. Scan the QR code with Google Authenticator, Authy, or any TOTP app
3. Enter the 6-digit code to confirm and activate
4. On the next login, you will be prompted for your authenticator code after entering your password

To disable 2FA, go back to **Settings → Security** and confirm with your current authenticator code.

> **Note:** If a user loses access to their authenticator app, an admin can clear `totpEnabled` and `totpSecret` on their account via Prisma Studio.

---

## Outbound Webhooks

Configure in **Settings → Integrations → Outbound Webhooks**.

Each webhook fires an HTTP POST with a JSON body:

```json
{
  "event": "task.created",
  "payload": { "task": { "id": "...", "title": "...", "priority": "HIGH", "boardId": "..." } },
  "timestamp": "2026-05-12T10:00:00.000Z"
}
```

If a **secret** is set, every request includes an `X-Boardly-Signature` header — an HMAC-SHA256 hex digest of the body signed with your secret.

**Available events:**

| Event | Triggered when |
|---|---|
| `task.created` | A new task is created |
| `task.moved` | A task is moved to a different column |
| `task.updated` | A task's fields are edited |
| `task.completed` | A task is moved to the last column |
| `comment.added` | A comment is posted on a task |
| `webhook.test` | The "Test" button is clicked in settings |

---

## CSV Import

Click **Import** in the board header (Admin / Manager only) to open the import dialog.

**Expected CSV columns** (header names are case-insensitive):

| Column | Required | Notes |
|---|---|---|
| `title` | ✅ Yes | Task title |
| `description` | No | Plain text description |
| `priority` | No | `CRITICAL`, `HIGH`, `MEDIUM` (default), or `LOW` |
| `dueDate` | No | Any format parseable by `new Date()` |
| `columnName` | No | Must match an existing column name (case-insensitive). Falls back to the first column |
| `assigneeEmail` | No | Must match a registered user's email address |

The dialog shows a 5-row preview and lets you remap column headers before importing.

---

## Custom Fields

Custom fields extend tasks with extra data specific to your team's workflow.

**To add a field:** Board header → **Settings** → **Custom Fields** → **Add Field**

**Field types:**

| Type | Use case |
|---|---|
| Text | Notes, URLs, ticket IDs |
| Number | Story points, estimates, weights |
| Date | Target dates, review deadlines |
| Dropdown | Status labels, categories, sprints |
| Checkbox | Done flag, blocked flag |

Fields appear in the task drawer under the **Fields** tab and auto-save on change.

---

## Roles

| Role | Boards | Tasks | Settings | Write APIs |
|---|---|---|---|---|
| **ADMIN** | Full access | Full access | All settings | ✅ |
| **MANAGER** | Create & manage | Full access | Board settings | ✅ |
| **MEMBER** | View & contribute | Create / edit assigned | — | ✅ |
| **VIEWER** | View only | View only | — | ❌ 403 |

Viewers are blocked at the middleware level — all `POST`, `PUT`, `PATCH`, and `DELETE` API calls return `403 Read-only access`. No UI bypass is possible.

---

## Microsoft SSO Setup

1. [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations → **New registration**
2. Name: `Boardly` — Supported account types: your tenant
3. Redirect URI: `http://YOUR_SERVER_IP:3000/api/auth/callback/azure-ad`
4. Note the **Application (client) ID** and **Directory (tenant) ID**
5. **Certificates & secrets** → New client secret → copy the value
6. Add to `.env.local`:
   ```env
   AZURE_AD_CLIENT_ID="your-client-id"
   AZURE_AD_CLIENT_SECRET="your-client-secret"
   AZURE_AD_TENANT_ID="your-tenant-id"
   ```

---

## LDAP / Active Directory Setup

The setup script will ask about LDAP interactively. To configure manually:

**Active Directory:**
```env
LDAP_URI="ldap://dc.company.com:389"
LDAP_BASE_DN="dc=company,dc=com"
LDAP_BIND_DN="cn=boardly-svc,ou=Service Accounts,dc=company,dc=com"
LDAP_BIND_PASSWORD="service-account-password"
LDAP_USER_FILTER="(sAMAccountName={{username}})"
```

**OpenLDAP / FreeIPA:**
```env
LDAP_URI="ldap://ldap.company.com:389"
LDAP_BASE_DN="dc=company,dc=com"
LDAP_BIND_DN="cn=admin,dc=company,dc=com"
LDAP_BIND_PASSWORD="admin-password"
LDAP_USER_FILTER="(uid={{username}})"
```

**LDAPS (TLS):**
```env
LDAP_URI="ldaps://dc.company.com:636"
LDAP_TLS_REJECT_UNAUTHORIZED="true"
```

Users who log in via LDAP are auto-provisioned with the `MEMBER` role. Admins can promote them in **Settings → Users**.

---

## Microsoft Teams Integration

1. In Teams, go to the channel → **⋯ → Connectors → Incoming Webhook**
2. Create the webhook and copy the URL
3. Add to `.env.local`:
   ```env
   TEAMS_WEBHOOK_URL="https://xxx.webhook.office.com/webhookb2/..."
   ```
4. Individual boards can override this URL in **Board Settings → Integrations**

---

## Start Scripts

| Command | Description |
|---|---|
| `./start.sh` or `start.bat` | Development server with hot reload |
| `./start.sh prod` or `start.bat prod` | Production build + optimized start |

---

## Production Deployment

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name boardly.yourcompany.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start "npx tsx server.ts" --name boardly
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build
EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
```

```bash
docker build -t boardly .
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/boardly.db:/app/boardly.db \
  -v $(pwd)/.env.local:/app/.env.local \
  --name boardly \
  boardly
```

---

## Project Structure

```
Boardly/
├── app/
│   ├── (auth)/
│   │   ├── login/              # Login page (local, LDAP, Microsoft SSO)
│   │   └── login/totp/         # 2FA verification step
│   ├── setup/                  # First-run setup wizard
│   ├── (dashboard)/
│   │   ├── page.tsx            # My Dashboard
│   │   ├── boards/[id]/        # Kanban board (kanban, calendar, timeline, swimlane)
│   │   ├── workspaces/[id]/    # Workspace overview
│   │   ├── reports/            # Analytics & reports
│   │   └── settings/
│   │       ├── users/          # User management
│   │       ├── teams/          # Team management
│   │       ├── labels/         # Label management
│   │       ├── sla/            # SLA policies
│   │       ├── notifications/  # Notification preferences
│   │       ├── integrations/   # Teams, Planner, Outbound webhooks
│   │       ├── security/       # 2FA setup/disable
│   │       └── boards/[id]/    # Per-board custom fields
│   └── api/                    # REST API routes
│       ├── tasks/              # CRUD + move + bulk + dependencies + custom fields
│       ├── boards/[id]/        # Board integrations, SLA, custom field definitions
│       ├── webhooks/           # Outbound webhook CRUD + test
│       ├── import/csv/         # CSV task import
│       ├── auth/totp/          # TOTP setup, verify, check, disable
│       └── reports/            # Workload, SLA, burndown, export
├── components/
│   ├── kanban/                 # Board, columns, cards, drawer, calendar, timeline, swimlanes
│   │   ├── timeline-view.tsx   # Gantt chart view
│   │   └── import-dialog.tsx   # CSV import dialog
│   ├── settings/
│   │   ├── webhook-settings.tsx      # Outbound webhook manager
│   │   ├── custom-field-manager.tsx  # Board custom fields manager
│   │   └── security-settings.tsx     # 2FA setup UI
│   └── ui/                     # shadcn/ui base components
├── lib/
│   ├── auth.ts                 # NextAuth (credentials, LDAP, Azure AD, TOTP check)
│   ├── db.ts                   # Prisma client singleton
│   ├── sla/                    # SLA engine and escalation
│   ├── notifications/
│   │   ├── dispatcher.ts       # Multi-channel dispatcher + outbound webhooks
│   │   └── email.ts            # Branded HTML email sender
│   ├── recurring/              # Recurring task scheduler
│   └── integrations/           # Teams, Planner, SMTP
├── prisma/
│   ├── schema.prisma           # Full schema (incl. Webhook, CustomFieldDef, TOTP)
│   ├── migrations/             # Migration history
│   └── seed.ts                 # Sample data for development
├── docs/
│   └── database-setup.md       # Enterprise database guide
├── server.ts                   # Custom HTTP server (Next.js + Socket.io + cron)
├── middleware.ts               # Auth guard + VIEWER role enforcement + first-run redirect
├── setup.sh / setup.bat        # Interactive setup scripts
├── start.sh / start.bat        # Dev and production start scripts
└── .env.local.example          # Environment variable reference
```

---

## Troubleshooting

**Database is locked (SQLite)**
Multiple Node processes are holding the file. Kill them and restart:
```bash
# Linux / macOS
pkill -f "tsx server.ts"

# Windows
taskkill /F /IM node.exe
```

**Auth routes returning 404**
```bash
rm -rf .next && ./start.sh
```

**Socket.io not connecting from another machine**
Make sure `AUTH_URL` in `.env.local` is the server LAN IP, not `localhost`.

**Cannot find module @prisma/client**
```bash
npx prisma generate
```

**Forgot admin password**
Use the admin's "Reset Password" option in **Settings → Users**, or:
```bash
npx prisma studio
# Navigate to User → find admin → clear passwordHash, then set a new one via the UI
```

**Setup wizard shows on every load**
The `setup_complete` cookie may have been cleared. Re-run setup or manually set `setupComplete = true` in `GlobalNotifConfig` via Prisma Studio.

**Lost access to authenticator app (2FA locked out)**
An admin can clear the user's 2FA via Prisma Studio:
```bash
npx prisma studio
# Navigate to User → find the locked account → set totpEnabled = false, totpSecret = null
```

**Webhook deliveries failing**
1. Verify the destination URL is reachable from the server
2. Click the **Test** button in Settings → Integrations → Outbound Webhooks to get a direct response code
3. Check that no firewall is blocking outbound HTTP from the server

---

## Changelog

### v5.0 — Security & Power Update

- **Two-Factor Authentication (TOTP)** — QR code setup, 6-digit login step, Security settings page, disable flow with confirmation
- **VIEWER role** — fourth role with API-level read-only enforcement (middleware returns 403 on all mutating methods)
- **Timeline / Gantt view** — third board view, pure-CSS horizontal bar chart grouped by column with today indicator
- **Outbound webhooks** — CRUD with HMAC-SHA256 signatures, per-event filtering, test endpoint, settings UI in Integrations
- **CSV import** — papaparse, column-mapping dialog, 5-row preview, bulk task insert with summary
- **Custom fields** — per-board field definitions (Text / Number / Date / Dropdown / Checkbox), Fields tab in task drawer, auto-save
- **Command palette (⌘K)** — global search upgraded to full modal palette with grouped results and arrow-key navigation
- **Bulk Set Priority** — new bulk action alongside existing move / assign / label
- **Branded email templates** — HTML emails with Boardly header, action button, footer; admin test-email button
- **Task dependencies UI** — add / remove block links directly in the task drawer with search-as-you-type

### v4.0 — User Feedback Update
> *Setup wizard · Report options · Admin user management · Performance*

- **Setup wizard** — guided first-run flow: workspace name, Solo/Team mode, admin account. No more default seed credentials
- **First-run redirect** — middleware detects empty database and routes new installs to `/setup` automatically
- **Report date presets** — 7d / 14d / 30d / 90d buttons on SLA and Burndown tabs
- **"My Tasks Only" toggle** — filter workload report to current user; auto-enabled for solo installs
- **Report metric cards** — summary cards on all three report tabs (workload, SLA, burndown)
- **Inline role editing** — change ADMIN / MANAGER / MEMBER from a dropdown in the user table
- **Inline team reassignment** — move users between teams without recreating them
- **Password reset UI** — admin can generate and set a new password for any user
- **Delete user** — confirmation dialog; self-deletion and self-demotion blocked at API level
- **Real last-login timestamps** — `lastLoginAt` field on User, updated on every sign-in
- **Toast notifications** — success and error feedback for all user management actions
- **Skeleton loading states** — pulse skeletons on reports, settings, and dashboard pages
- **HTTP caching** — Cache-Control headers on workload (30s), SLA/burndown (60s), labels (5min), teams (2min)

### v3.0 — Enterprise Auth & Productivity
- LDAP / Active Directory authentication with auto-provisioning
- WIP limits on columns (orange at 80%, red at 100%)
- Swimlane view — group by Assignee, Priority, or Label
- Keyboard shortcuts overlay (`?`)
- Time tracking — log minutes per task with notes
- Board templates — save and create boards from templates
- Task templates — reusable task starters
- Inline column rename (double-click, Admin/Manager only)
- Boardly rebrand

### v2.0 — Collaboration & Views
- Global search across tasks, comments, and boards
- My Dashboard — stats, my tasks, @mentions, activity feed
- Task dependencies with circular detection
- Bulk operations with floating action bar
- File attachments (upload / download / delete)
- Task watchers with notification fan-out
- Calendar view
- Dark mode toggle
- Recurring task scheduler
- Task clone / duplicate

### v1.0 — Foundation
- Core Kanban with drag-and-drop and real-time updates (Socket.io)
- Workspaces, boards, columns, tasks, subtasks, labels
- Comments with @mentions
- SLA engine with escalation and audit trail
- Role-based access (ADMIN / MANAGER / MEMBER)
- Microsoft SSO (Azure AD), Teams webhook, Planner two-way sync
- SMTP email, browser push notifications
- Reports and analytics, board embed

---

<div align="center">

Built with Next.js · Runs on your server · No subscriptions · No cloud lock-in

</div>
