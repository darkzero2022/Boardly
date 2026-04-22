<div align="center">

# Boardly

**Self-hosted team task management — built for your LAN, not the cloud**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A full-featured Kanban application for teams of 16–500 users. Drag-and-drop boards, SLA tracking, swimlanes, time tracking, real-time collaboration, and Microsoft 365 integration — all running on your own server with zero cloud dependency.

[Quick Start](#quick-start) · [Database Options](#database-options) · [Configuration](#environment-variables) · [Deployment](#production-deployment) · [Roles](#roles)

</div>

---

## Features

### Kanban Boards
| Feature | Description |
|---|---|
| Drag-and-drop | Smooth DnD via `@dnd-kit` — reorder tasks and move between columns |
| Multiple workspaces | Organize boards by team, project, or department |
| Column management | Create, rename (double-click), reorder, and color columns |
| WIP limits | Max task count per column — orange warning at 80%, red at 100% |
| Inline column rename | Double-click any column header (Admin/Manager) |

### Views
| View | Description |
|---|---|
| **Kanban** | Classic column board with real-time drag-and-drop |
| **Calendar** | Monthly calendar showing tasks by due date, color-coded by priority |
| **Swimlanes** | Group tasks within columns by Assignee, Priority, or Label |

### Task Management
| Feature | Description |
|---|---|
| Rich task drawer | Description, assignee, labels, due date, priority, subtasks, comments, full history |
| Subtasks | Nested hierarchy with independent tracking |
| Labels | Color-coded labels, multiple per task |
| Task dependencies | Blocks / blocked-by relationships with circular dependency detection |
| Task cloning | Duplicate any task with one click |
| File attachments | Upload files per task, stored on server disk |
| Task watchers | Watch any task to receive all its notifications |
| Time tracking | Log minutes with notes per task; total displayed in drawer tab |
| Recurring tasks | Auto-clone daily / weekly / monthly via scheduled cron |

### Productivity
| Feature | Description |
|---|---|
| Global search | Instant search across tasks, comments, and boards with debounced popover |
| Bulk operations | Multi-select tasks → move column, reassign, add label, or delete |
| Keyboard shortcuts | `?` overlay — `N` new task, `B` bulk, `1/2` switch views, `Esc` close |
| Board templates | Save any board as a template (columns + SLA policy), create new boards from it |
| Task templates | Reusable task starters insertable from the New Task dialog |
| My Dashboard | Personal view — stats, my tasks by priority, @mentions, activity feed |

### SLA & Automation
| Feature | Description |
|---|---|
| SLA engine | Per-board policies (hours by priority). Tasks get auto-calculated deadlines |
| SLA escalation | Configurable escalation steps — assignee → manager → admin |
| Audit trail | Full history of every field change on every task |
| Recurring scheduler | Hourly cron clones recurring tasks on schedule |

### Collaboration
| Feature | Description |
|---|---|
| Real-time updates | Socket.io — moves, new tasks, and comments appear instantly on all connected browsers |
| Comments & @mentions | Threaded comments; @mention a user to notify them |
| Notifications | In-app bell, email (SMTP), browser push (VAPID) |

### Authentication
| Method | Description |
|---|---|
| Local accounts | Email + bcrypt password. Admin controls who can register |
| LDAP / Active Directory | Corporate directory login — AD, OpenLDAP, FreeIPA. Auto-provisions users on first login |
| Microsoft SSO | Azure AD / Entra ID OAuth. Admin can enable/disable per provider |

### Microsoft 365 Integration
| Feature | Description |
|---|---|
| Teams webhooks | Post task events to Teams channels via Incoming Webhook |
| Teams bot | `create task`, `assign`, `status [id]` commands |
| Teams tab | Embed any board as a Teams tab |
| Planner two-way sync | Sync tasks with Microsoft Planner via Graph API |

### Admin & Reporting
| Feature | Description |
|---|---|
| Role-based access | ADMIN / MANAGER / MEMBER with per-board overrides |
| Reports | Workload distribution, SLA compliance, burndown charts |
| CSV / Excel export | Export any report |
| Dark mode | Full dark theme, persisted per user |
| Board embed | Embed any board as an iframe |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) |
| Database | SQLite · PostgreSQL · MySQL (via Prisma) |
| ORM | [Prisma](https://prisma.io) |
| Auth | [NextAuth v5](https://authjs.dev) — credentials + LDAP + Azure AD |
| Real-time | [Socket.io](https://socket.io) |
| Drag & Drop | [@dnd-kit](https://dndkit.com) |
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
3. **Ask you to choose a database** (SQLite / PostgreSQL / MySQL)
4. **Ask whether to enable LDAP** (optional — for on-premise AD/LDAP)
5. Generate `.env.local` with a random auth secret and your LAN IP
6. Run database migrations and seed the admin account

**Default login after setup:**
```
Email:    admin@boardly.local
Password: admin123
```

> Change the admin password immediately after first login.

---

## Database Options

The setup script walks you through this interactively. See **[docs/database-setup.md](docs/database-setup.md)** for full details including connection pooling, backups, HA, and migrating SQLite → PostgreSQL.

| Database | Best for | Example connection string |
|---|---|---|
| **SQLite** (default) | ≤ 30 users, single server, zero config | `file:./boardly.db` |
| **PostgreSQL** | 30–500+ users, HA, cloud | `postgresql://user:pass@host:5432/boardly` |
| **MySQL / MariaDB** | Existing MySQL infrastructure | `mysql://user:pass@host:3306/boardly` |

Managed cloud options: Supabase, Neon, Railway, AWS RDS, PlanetScale.

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values, or let `setup.sh` / `setup.bat` generate it automatically.

### Required
| Variable | Description |
|---|---|
| `DATABASE_URL` | Database connection string |
| `AUTH_SECRET` | Random secret for NextAuth (auto-generated by setup) |
| `AUTH_URL` | Full URL of the app, e.g. `http://192.168.1.10:3000` |

### LDAP / Active Directory
| Variable | Description |
|---|---|
| `LDAP_URI` | LDAP server URI, e.g. `ldap://dc.company.com:389`. Leave blank to disable |
| `LDAP_BASE_DN` | Base DN, e.g. `dc=company,dc=com` |
| `LDAP_BIND_DN` | Service account DN for searching (leave blank for anonymous bind) |
| `LDAP_BIND_PASSWORD` | Service account password |
| `LDAP_USER_FILTER` | Search filter. Default covers `sAMAccountName`, `uid`, `userPrincipalName` |
| `LDAP_TLS_REJECT_UNAUTHORIZED` | Set to `false` for self-signed certs. Default: `true` |

### Microsoft SSO
| Variable | Description |
|---|---|
| `AZURE_AD_CLIENT_ID` | Azure App Registration client ID. Leave blank to disable |
| `AZURE_AD_CLIENT_SECRET` | Client secret |
| `AZURE_AD_TENANT_ID` | Directory (tenant) ID |

### Notifications
| Variable | Description |
|---|---|
| `SMTP_HOST` | SMTP server hostname. Leave blank to disable email |
| `SMTP_PORT` | Default: `587` |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials |
| `SMTP_FROM` | From address, e.g. `Boardly <noreply@boardly.local>` |
| `VAPID_PUBLIC_KEY` | Browser push public key — generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Browser push private key |

### Microsoft 365 Integration
| Variable | Description |
|---|---|
| `TEAMS_WEBHOOK_URL` | Teams Incoming Webhook URL. Leave blank to disable |
| `GRAPH_CLIENT_ID` | MS Graph app ID for Planner sync |
| `GRAPH_CLIENT_SECRET` | MS Graph client secret |
| `GRAPH_TENANT_ID` | MS Graph tenant ID |

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

Users who log in via LDAP are auto-provisioned with the `MEMBER` role on first login. Admins can promote them in **Settings → Users**.

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
| `./start.sh prod` or `start.bat prod` | Production build + start |

---

## Production Deployment

### Nginx reverse proxy
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

### PM2 (process manager)
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

## Roles

| Role | Boards | Tasks | Settings | Users |
|---|---|---|---|---|
| **ADMIN** | Full access | Full access | All settings | Create / edit / delete |
| **MANAGER** | Create & manage | Full access | Board settings | View |
| **MEMBER** | View & work | Create / edit assigned | — | View |

---

## Project Structure

```
Boardly/
├── app/
│   ├── (auth)/login/           # Login page (local, LDAP, Microsoft SSO)
│   ├── (dashboard)/            # Authenticated pages
│   │   ├── page.tsx            # My Dashboard
│   │   ├── boards/[id]/        # Kanban board (kanban, calendar, swimlane views)
│   │   ├── workspaces/[id]/    # Workspace overview
│   │   ├── reports/            # Analytics & reports
│   │   └── settings/           # Users, teams, SLA, notifications, integrations
│   └── api/                    # REST API routes
├── components/
│   ├── kanban/                 # Board, columns, cards, drawer, calendar, swimlanes
│   ├── dashboard/              # Dashboard widgets
│   ├── board-templates/        # Board template dialogs
│   ├── task-templates/         # Task template picker
│   └── ui/                     # shadcn/ui base components
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── auth/ldap.ts            # LDAP authentication module
│   ├── db.ts                   # Prisma client singleton
│   ├── sla/                    # SLA engine and escalation
│   ├── notifications/          # Email, push, in-app dispatcher
│   ├── recurring/              # Recurring task scheduler
│   └── integrations/           # Teams, Planner, SMTP
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # SQLite migration history
│   └── seed.ts                 # Initial data (admin user, sample workspace)
├── docs/
│   └── database-setup.md       # Enterprise database guide
├── server.ts                   # Custom HTTP server (Next.js + Socket.io + cron)
├── setup.sh / setup.bat        # Interactive setup scripts
├── start.sh / start.bat        # Dev and production start scripts
└── .env.local.example          # Environment variable reference
```

---

## Troubleshooting

**Database is locked (SQLite)**
Multiple Node processes hold the file. Kill them all and restart:
```bash
# Linux/macOS
pkill -f "tsx server.ts"

# Windows
taskkill /F /IM node.exe
```

**Auth routes returning 404**
```bash
rm -rf .next
./start.sh
```

**Socket.io not connecting from another machine**
Ensure `AUTH_URL` in `.env.local` is set to the server LAN IP, not `localhost`.

**Cannot find module @prisma/client**
```bash
npx prisma generate
```

**Forgot admin password**
```bash
npx prisma studio
# Navigate to User → find admin → edit passwordHash
```

---

## Changelog

### v3.0
- LDAP / Active Directory authentication with auto-provisioning
- WIP limits on columns (orange at 80%, red at 100%)
- Swimlane view — group by Assignee, Priority, or Label
- Keyboard shortcuts overlay (`?`)
- Time tracking — log minutes per task with notes
- Board templates — save and create boards from templates
- Task templates — reusable task starters
- Inline column rename (double-click, Admin/Manager only)
- Boardly rebrand

### v2.0
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

### v1.0
- Core Kanban with drag-and-drop and real-time updates (Socket.io)
- Workspaces, boards, columns, tasks, subtasks, labels
- Comments with @mentions
- SLA engine with escalation and audit trail
- Role-based access (ADMIN / MANAGER / MEMBER)
- Microsoft SSO (Azure AD), Teams webhook, Planner two-way sync
- SMTP email, browser push notifications
- Reports and analytics, board embed, dark mode

---

<div align="center">

Built with Next.js · Runs on your server · No subscriptions · No cloud lock-in

</div>
