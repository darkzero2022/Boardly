# KanBoard — Database Setup Guide

KanBoard supports three database backends. Choose the one that fits your deployment size and infrastructure.

---

## Quick Comparison

| | SQLite | PostgreSQL | MySQL / MariaDB |
|---|---|---|---|
| **Best for** | 1–30 users, single server | 30–500+ users, enterprise | Existing MySQL infra |
| **Setup effort** | Zero — file on disk | Medium | Medium |
| **Concurrent writes** | Limited (WAL mode) | Excellent | Excellent |
| **Backups** | Copy one `.db` file | `pg_dump` / managed snapshots | `mysqldump` / managed |
| **High availability** | No | Yes (replicas, PgBouncer) | Yes (replicas) |
| **Managed cloud options** | — | Supabase, Neon, RDS, Railway | PlanetScale, RDS, Railway |
| **Cost** | Free | Free (self-hosted) | Free (self-hosted) |

---

## Option 1 — SQLite (Default)

SQLite is the default. Zero configuration needed.

**When to use:** Small teams (< 30 users), single-server deployments, development/staging, quick self-hosted installs.

**Limitations:**
- Only one write at a time (WAL mode mitigates this for reads)
- No network access — app must run on the same machine as the DB file
- Not suitable for clustering / horizontal scaling

**Configuration in `.env.local`:**
```env
DATABASE_URL="file:./kanboard.db"
```

**Backup:**
```bash
# Stop the app, then copy the file
cp kanboard.db kanboard.db.backup

# Or use sqlite3 online backup (safe while running)
sqlite3 kanboard.db ".backup kanboard-backup.db"
```

---

## Option 2 — PostgreSQL (Recommended for Enterprise)

PostgreSQL is the recommended production database for teams of 30+ users.

### Step 1 — Install PostgreSQL

**Ubuntu / Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/ and run the installer.

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Docker (quickest):**
```bash
docker run -d \
  --name kanboard-postgres \
  -e POSTGRES_USER=kanboard \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=kanboard \
  -p 5432:5432 \
  -v kanboard-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

### Step 2 — Create the database and user

```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Create dedicated user and database
CREATE USER kanboard WITH PASSWORD 'your_secure_password';
CREATE DATABASE kanboard OWNER kanboard;
GRANT ALL PRIVILEGES ON DATABASE kanboard TO kanboard;
\q
```

### Step 3 — Update `prisma/schema.prisma`

Change the datasource provider from `sqlite` to `postgresql`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

> **Note:** The rest of the schema (models, fields, relations) is fully compatible with PostgreSQL. No other changes needed.

### Step 4 — Update `.env.local`

```env
DATABASE_URL="postgresql://kanboard:your_secure_password@localhost:5432/kanboard"
```

**Connection string format:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

**Common examples:**
```env
# Local
DATABASE_URL="postgresql://kanboard:pass@localhost:5432/kanboard"

# With schema
DATABASE_URL="postgresql://kanboard:pass@localhost:5432/kanboard?schema=public"

# Remote / cloud
DATABASE_URL="postgresql://kanboard:pass@db.example.com:5432/kanboard?sslmode=require"

# Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Neon (serverless)
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"

# Railway
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway"
```

### Step 5 — Run migrations

```bash
# Generate Prisma client for the new provider
npx prisma generate

# Apply migrations (creates all tables)
npx prisma migrate deploy

# OR for a fresh setup without migration history:
npx prisma db push
```

### Step 6 — Seed the database

```bash
npx tsx prisma/seed.ts
```

---

## Option 3 — MySQL / MariaDB

Use this if your infrastructure already runs MySQL.

### Step 1 — Install MySQL

**Ubuntu / Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

**Docker:**
```bash
docker run -d \
  --name kanboard-mysql \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_USER=kanboard \
  -e MYSQL_PASSWORD=your_secure_password \
  -e MYSQL_DATABASE=kanboard \
  -p 3306:3306 \
  -v kanboard-mysqldata:/var/lib/mysql \
  mysql:8.0
```

### Step 2 — Create database and user

```sql
mysql -u root -p

CREATE DATABASE kanboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kanboard'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON kanboard.* TO 'kanboard'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3 — Update `prisma/schema.prisma`

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### Step 4 — Update `.env.local`

```env
DATABASE_URL="mysql://kanboard:your_secure_password@localhost:3306/kanboard"
```

### Step 5 — Run migrations

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

---

## Managed Cloud Options (Zero-Ops)

For teams that don't want to manage a database server:

### Supabase (PostgreSQL — Free tier available)
1. Create project at https://supabase.com
2. Go to **Settings → Database → Connection string → URI**
3. Copy the URI and paste into `DATABASE_URL`
4. Run `npx prisma db push`

### Neon (Serverless PostgreSQL — Free tier available)
1. Create project at https://neon.tech
2. Copy the connection string from the dashboard
3. Paste into `DATABASE_URL` (add `?sslmode=require`)
4. Run `npx prisma db push`

### Railway (PostgreSQL or MySQL)
1. Create project at https://railway.app
2. Add a PostgreSQL or MySQL plugin
3. Copy `DATABASE_URL` from the plugin's Variables tab
4. Run `npx prisma db push`

### PlanetScale (MySQL-compatible — Free tier available)
1. Create database at https://planetscale.com
2. Copy connection string
3. Add `?sslaccept=strict` to the URL
4. Change schema.prisma: `provider = "mysql"` and add `relationMode = "prisma"` to datasource
5. Run `npx prisma db push`

---

## Migrating from SQLite to PostgreSQL

If you started with SQLite and want to move to PostgreSQL:

### Step 1 — Export your SQLite data

```bash
# Install sqlite-to-postgres tool
npm install -g pgloader

# OR use the built-in export
node scripts/export-sqlite.js > kanboard-export.sql
```

### Step 2 — Switch the provider

Update `prisma/schema.prisma` and `.env.local` as described in Option 2 above.

### Step 3 — Use pgloader for automatic migration

```bash
pgloader sqlite:./kanboard.db postgresql://kanboard:pass@localhost:5432/kanboard
```

> **Note:** After migration, run `npx prisma migrate deploy` to ensure the migration history is in sync.

### Step 4 — Verify the data

```bash
npx prisma studio
```

---

## Connection Pooling (Production Best Practice)

For production PostgreSQL deployments with many concurrent users, use a connection pooler:

### PgBouncer (self-hosted)

```bash
sudo apt install pgbouncer

# /etc/pgbouncer/pgbouncer.ini
[databases]
kanboard = host=localhost port=5432 dbname=kanboard

[pgbouncer]
listen_port = 6432
listen_addr = localhost
auth_type = md5
pool_mode = transaction
max_client_conn = 200
default_pool_size = 25
```

Update `DATABASE_URL` to point to PgBouncer:
```env
DATABASE_URL="postgresql://kanboard:pass@localhost:6432/kanboard?pgbouncer=true"
```

### Supabase / Neon / Railway

These managed services include connection pooling built-in. Use the **pooler connection string** they provide.

---

## Backup Strategies

### SQLite
```bash
# Daily backup cron
0 2 * * * sqlite3 /path/to/kanboard.db ".backup /backups/kanboard-$(date +%Y%m%d).db"
```

### PostgreSQL
```bash
# Daily backup cron
0 2 * * * pg_dump -U kanboard kanboard | gzip > /backups/kanboard-$(date +%Y%m%d).sql.gz

# Restore
gunzip -c /backups/kanboard-20260405.sql.gz | psql -U kanboard kanboard
```

### MySQL
```bash
# Daily backup cron
0 2 * * * mysqldump -u kanboard -p'password' kanboard | gzip > /backups/kanboard-$(date +%Y%m%d).sql.gz

# Restore
gunzip -c /backups/kanboard-20260405.sql.gz | mysql -u kanboard -p'password' kanboard
```

---

## Troubleshooting

### "Database is locked" (SQLite only)
Multiple processes are trying to write simultaneously. Ensure only one KanBoard instance is running:
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill -f "tsx server.ts"
```

### "Connection refused" (PostgreSQL/MySQL)
- Check the service is running: `systemctl status postgresql`
- Check the host/port in `DATABASE_URL`
- Check firewall rules allow the port (5432 for PG, 3306 for MySQL)

### "SSL required" errors
Add `?sslmode=require` (PostgreSQL) or `?ssl=true` (MySQL) to your connection string.

### Prisma migration errors after switching provider
```bash
# Reset migration history and re-apply
npx prisma migrate reset
npx prisma db push
npx tsx prisma/seed.ts
```
