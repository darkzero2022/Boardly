# KanBoard — Self-Hosted Team Task Management

> A full-featured, self-hosted Kanban application for teams of 16–500 users. Built like Asana — drag-and-drop boards, SLA tracking, time tracking, swimlanes, Microsoft 365 integration, real-time collaboration, and role-based access. No cloud dependency required. Runs on your own server or LAN.

---

## Feature Overview

### Core Kanban
| Feature | Description |
|---|---|
| Drag-and-drop boards | Smooth DnD via @dnd-kit — reorder tasks and move between columns |
| Multiple workspaces | Organize boards by team, project, or department |
| Column management | Create, rename, reorder columns. Set WIP limits with visual warnings |
| Task detail drawer | Full task panel — description, assignee, labels, due date, subtasks, comments, history |
| Subtasks | Nested task hierarchy with independent SLA tracking |
| Labels | Color-coded labels, multi-select per task |
| Assignees & reporters | Assign tasks to users, track who reported |
| Due dates | Per-task deadlines with calendar picker |
| Recurring tasks | Daily / weekly / monthly auto-clone via scheduled cron |
| Task dependencies | Blocks / blocked-by relationships with circular dependency detection |
| Task cloning | Duplicate any task with one click |
| File attachments | Upload files per task, stored on server disk |

### Views
| View | Description |
|---|---|
| Kanban | Classic column-based board with drag-and-drop |
| Calendar | Monthly calendar showing tasks by due date |
| Swimlanes | Group tasks within columns by Assignee, Priority, or Label |

### Productivity
| Feature | Description |
|---|---|
| Global search | Instant search across tasks, comments, and boards |
| Bulk operations | Multi-select tasks → move column, reassign, add/remove label, delete |
| Keyboard shortcuts | `?` overlay: `B` bulk, `1/2` views, `Escape` close |
| Task templates | Save reusable task structures, insert from New Task dialog |
| Board templates | Save any board (columns + SLA) as a template, create new boards from it |
| Task watchers | Watch/unwatch tasks, receive notifications on activity |
| Time tracking | Log minutes per task with notes, total shown in task drawer |

### Automation & SLA
| Feature | Description |
|---|---|
| SLA engine | Per-board SLA policies (Critical/High/Medium/Low hours). Tasks auto-assigned deadlines |
| SLA escalation | Breach escalation with configurable steps |
| Recurring scheduler | Hourly cron — clones recurring tasks on schedule |
| Audit trail | Full history of every change on every task |

### Collaboration
| Feature | Description |
|---|---|
| Real-time updates | Socket.io — task moves and updates appear instantly on all connected browsers |
| Comments | Threaded comments with @mention support |
| @Mentions | Notify users by name in comments |
| My Dashboard | Personal view — stats, my tasks, @mentions, activity feed |
| Notifications | In-app notification center (bell), email (SMTP), browser push |

### Microsoft 365 Integration
| Feature | Description |
|---|---|
| Microsoft SSO | Azure AD / Entra ID sign-in |
| Teams webhooks | Post task events to Teams channels |
| Planner sync | Two-way sync with Microsoft Planner via Graph API |

### Admin & Security
| Feature | Description |
|---|---|
| Role-based access | ADMIN / MANAGER / MEMBER roles |
| Board embed | Embed any board as an iframe for dashboards |
| Dark mode | Full dark theme, persisted per user |
| Reports | Task completion, SLA breach, workload, burndown charts |

---

## Screenshots

### Login
![Login](docs/screenshots/login.png)
Local credentials or Microsoft SSO. Admin controls which methods are enabled.

### My Dashboard
![Dashboard](docs/screenshots/dashboard.png)
Personal overview: stats row, my tasks by priority, @mentions, activity feed.

### Kanban Board
![Board](docs/screenshots/board.png)
Drag-and-drop columns with WIP limit badges. Real-time across all connected users.

### Swimlane View
![Swimlanes](docs/screenshots/swimlanes.png)
Group tasks by Assignee, Priority, or Label across all columns.

### Calendar View
![Calendar](docs/screenshots/calendar.png)
Monthly calendar of tasks with due dates. Color-coded by priority.

### Task Detail Drawer
![Task Detail](docs/screenshots/task-detail.png)
Full task panel with tabs: Details, Comments, Subtasks, Attachments, Time, History.

### Time Tracking
![Time Tracking](docs/screenshots/time-tracking.png)
Log time per task with notes. Total displayed in tab header.

### Reports
![Reports](docs/screenshots/reports.png)
SLA breach rates, workload distribution, task completion trends.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (default) / PostgreSQL / MySQL |
| ORM | Prisma |
| Auth | NextAuth v5 (credentials + Azure AD) |
| Real-time | Socket.io (attached to same HTTP server) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Scheduling | node-cron |
| Server | Custom tsx server (server.ts) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Git

### Windows
```bat
git clone https://github.com/darkzero2022/KanBoard.git
cd KanBoard
setup.bat
start.bat
```

### Linux / macOS
```bash
git clone https://github.com/darkzero2022/KanBoard.git
cd KanBoard
chmod +x setup.sh start.sh
./setup.sh
./start.sh
```

The setup script will:
1. Check Node.js version
2. Install all dependencies
3. **Ask you to choose a database** (SQLite / PostgreSQL / MySQL)
4. Generate `.env.local` with a random auth secret and your LAN IP
5. Run database migrations
6. Seed the admin account and sample workspace

**Default credentials after setup:**
```
Email:    admin@kanboard.local
Password: admin123
```

---

## Database Options

The setup script asks you to choose. See **[docs/database-setup.md](docs/database-setup.md)** for full details.

### 1. SQLite (default — zero config)
```env
DATABASE_URL="file:./kanboard.db"
```
Best for: ≤ 30 users, single server, quick deployments. No database server needed.

### 2. PostgreSQL (recommended for enterprise)
```env
DATABASE_URL="postgresql://kanboard:password@localhost:5432/kanboard"
```
Best for: 30–500+ users, high availability, managed cloud. Supports Supabase, Neon, Railway, AWS RDS.

### 3. MySQL / MariaDB
```env
DATABASE_URL="mysql://kanboard:password@localhost:3306/kanboard"
```
Best for: Teams that already run MySQL infrastructure. Supports PlanetScale, Railway, AWS RDS.

> For managed cloud options, connection pooling, backups, and migrating from SQLite → PostgreSQL, see [docs/database-setup.md](docs/database-setup.md).

---

## Environment Variables

All variables are documented in [`.env.local.example`](.env.local.example). The setup script generates `.env.local` automatically.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string |
| `AUTH_SECRET` | Yes | NextAuth secret (auto-generated by setup) |
| `AUTH_URL` | Yes | App URL (auto-detected by setup) |
| `AZURE_AD_CLIENT_ID` | No | Microsoft SSO — leave blank to disable |
| `AZURE_AD_CLIENT_SECRET` | No | Microsoft SSO |
| `AZURE_AD_TENANT_ID` | No | Microsoft SSO |
| `SMTP_HOST` | No | Email notifications — leave blank to disable |
| `SMTP_PORT` | No | Default: 587 |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `VAPID_PUBLIC_KEY` | No | Browser push — generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | No | Browser push |
| `TEAMS_WEBHOOK_URL` | No | MS Teams notifications — leave blank to disable |
| `GRAPH_CLIENT_ID` | No | MS Planner sync — leave blank to disable |
| `GRAPH_CLIENT_SECRET` | No | MS Planner sync |
| `GRAPH_TENANT_ID` | No | MS Planner sync |
| `PORT` | No | Server port. Default: 3000 |

---

## Start Scripts

### Development (hot reload)
```bash
# Linux/Mac
./start.sh

# Windows
start.bat
```

### Production (optimized build)
```bash
# Linux/Mac
./start.sh prod

# Windows
start.bat prod
```

---

## Microsoft SSO Configuration

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations → New registration
2. Name: `KanBoard`, Supported account types: your tenant
3. Redirect URI: `http://YOUR_SERVER_IP:3000/api/auth/callback/azure-ad`
4. After creation: note the **Application (client) ID** and **Directory (tenant) ID**
5. Go to **Certificates & secrets** → New client secret → copy the value
6. Set in `.env.local`:
   ```env
   AZURE_AD_CLIENT_ID="your-client-id"
   AZURE_AD_CLIENT_SECRET="your-client-secret"
   AZURE_AD_TENANT_ID="your-tenant-id"
   ```
7. Restart the server

---

## Microsoft Teams Integration

1. In Teams, go to the channel → ⋯ → Connectors → Incoming Webhook
2. Create webhook, copy the URL
3. Set in `.env.local`:
   ```env
   TEAMS_WEBHOOK_URL="https://xxx.webhook.office.com/webhookb2/..."
   ```
4. Individual boards can override this URL in **Board Settings → Integrations**

---

## Production Deployment

### Nginx reverse proxy (recommended)
```nginx
server {
    listen 80;
    server_name kanboard.yourcompany.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 (process manager)
```bash
npm install -g pm2
pm2 start "npx tsx server.ts" --name kanboard
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
docker build -t kanboard .
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/kanboard.db:/app/kanboard.db \
  -v $(pwd)/.env.local:/app/.env.local \
  --name kanboard \
  kanboard
```

---

## Roles

| Role | Boards | Tasks | Settings | Users |
|---|---|---|---|---|
| **ADMIN** | Full access | Full access | All settings | Create/edit/delete |
| **MANAGER** | Create & manage | Full access | Board settings | View |
| **MEMBER** | View & work | Create/edit assigned | — | View |

---

## Troubleshooting

### "Database is locked" (SQLite)
Multiple Node processes are holding the database. Kill them all and restart:
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill -f "tsx server.ts"
```

### Auth routes returning 404
The Next.js build cache may be stale:
```bash
rm -rf .next
./start.sh
```

### Socket.io not connecting
Ensure you're accessing the app via the server's IP/hostname, not `localhost` from another machine. Check `AUTH_URL` in `.env.local` matches the actual URL.

### "Cannot find module '@prisma/client'"
Run `npx prisma generate` after any schema changes.

### Forgot admin password
```bash
# Reset via Prisma Studio
npx prisma studio
# Navigate to User → find admin → edit passwordHash field
# Or re-seed (WARNING: deletes all data)
npx tsx prisma/seed.ts
```

---

## Project Structure

```
KanBoard/
├── app/                    # Next.js App Router pages & API routes
│   ├── (dashboard)/        # Authenticated pages (board, workspace, reports…)
│   ├── api/                # REST API routes
│   └── login/              # Auth pages
├── components/             # React components
│   ├── kanban/             # Board, columns, cards, drawer, calendar, swimlanes
│   ├── dashboard/          # Dashboard widgets
│   ├── board-templates/    # Board template dialogs
│   ├── task-templates/     # Task template picker
│   └── ui/                 # shadcn/ui base components
├── lib/                    # Server-side utilities
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Prisma client singleton
│   ├── sla/                # SLA engine
│   ├── notifications/      # Notification dispatcher
│   ├── recurring/          # Recurring task scheduler
│   └── integrations/       # Teams, Planner, SMTP
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts             # Initial data seed
├── docs/
│   └── database-setup.md   # Enterprise database guide
├── server.ts               # Custom HTTP server (Next.js + Socket.io)
├── setup.sh / setup.bat    # One-command setup scripts
├── start.sh / start.bat    # Start scripts (dev + prod)
└── .env.local.example      # Environment variable template
```

---

## Changelog

### v3.0 (Sprint 3)
- WIP limits on columns with orange/red visual warnings
- Swimlane view — group by Assignee, Priority, or Label
- Keyboard shortcuts overlay (`?`)
- Time tracking — log minutes per task, total in tab
- Board templates — save and create boards from templates
- Task templates — reusable task starters in New Task dialog
- Dropdown menu component (Radix UI)

### v2.0 (Sprint 2)
- Global search (tasks, comments, boards) with debounced popover
- My Dashboard — stats, my tasks, @mentions, activity feed
- Task dependencies — blocks/blocked-by with circular detection
- Bulk operations — multi-select with floating action bar
- File attachments — upload/download/delete per task
- Task watchers — watch/unwatch with fan-out notifications
- Calendar view — monthly, toggle with Kanban
- Dark mode toggle in header
- Recurring task scheduler (hourly cron)
- Task clone/duplicate

### v1.0 (Sprint 1)
- Core Kanban with drag-and-drop
- Workspaces, boards, columns, tasks, subtasks
- Comments with @mentions
- Labels, assignees, due dates
- SLA engine with escalation
- Audit trail (full history)
- Role-based access (ADMIN/MANAGER/MEMBER)
- Real-time via Socket.io
- Microsoft SSO (Azure AD)
- Microsoft Teams webhook
- MS Planner two-way sync
- SMTP email notifications
- Browser push notifications
- Board embed (iframe)
- Reports & analytics
- Dark mode support
