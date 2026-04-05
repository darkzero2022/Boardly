#!/usr/bin/env bash
set -e

echo ""
echo " ╔══════════════════════════════════════════════════╗"
echo " ║            Boardly Setup — v3.0                  ║"
echo " ║   Self-hosted Team Task Management               ║"
echo " ╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Check Node.js ──────────────────────────────────────────────────────────
echo "[1/6] Checking Node.js..."
if ! command -v node &>/dev/null; then
    echo " ERROR: Node.js is not installed."
    echo " Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
NODE_VER=$(node --version)
MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
if [ "$MAJOR" -lt 18 ]; then
    echo " ERROR: Node.js 18+ required. You have $NODE_VER"
    exit 1
fi
echo " OK: Node.js $NODE_VER"

# ── 2. Install dependencies ───────────────────────────────────────────────────
echo ""
echo "[2/6] Installing dependencies..."
npm install --legacy-peer-deps --silent
echo " OK: Dependencies installed"

# ── 3. Database selection ─────────────────────────────────────────────────────
echo ""
echo " ╔══════════════════════════════════════════════════╗"
echo " ║              Choose Your Database               ║"
echo " ╠══════════════════════════════════════════════════╣"
echo " ║                                                  ║"
echo " ║  1) SQLite  (default)                            ║"
echo " ║     · Zero config, file on disk                  ║"
echo " ║     · Best for: 1-30 users, single server        ║"
echo " ║     · No installation required                   ║"
echo " ║                                                  ║"
echo " ║  2) PostgreSQL  (recommended for enterprise)     ║"
echo " ║     · Concurrent writes, connection pooling      ║"
echo " ║     · Best for: 30-500+ users, HA deployments   ║"
echo " ║     · Supports Supabase, Neon, Railway, RDS      ║"
echo " ║                                                  ║"
echo " ║  3) MySQL / MariaDB                              ║"
echo " ║     · Use if you already run MySQL infrastructure ║"
echo " ║     · Supports PlanetScale, RDS, Railway         ║"
echo " ║                                                  ║"
echo " ╚══════════════════════════════════════════════════╝"
echo ""
read -rp " Enter choice [1/2/3] (default: 1): " DB_CHOICE
DB_CHOICE=${DB_CHOICE:-1}

DB_PROVIDER="sqlite"
DATABASE_URL="file:./kanboard.db"

if [ "$DB_CHOICE" = "2" ]; then
    DB_PROVIDER="postgresql"
    echo ""
    echo " PostgreSQL connection string format:"
    echo "   postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    echo ""
    echo " Examples:"
    echo "   Local:    postgresql://kanboard:pass@localhost:5432/kanboard"
    echo "   Supabase: postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"
    echo "   Neon:     postgresql://user:pass@ep-xxx.neon.tech/kanboard?sslmode=require"
    echo "   Railway:  (copy from Railway dashboard Variables tab)"
    echo ""
    echo " See docs/database-setup.md for full setup instructions."
    echo ""
    read -rp " Enter PostgreSQL connection string: " DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
        echo " ERROR: Connection string cannot be empty."
        exit 1
    fi
    echo " OK: PostgreSQL selected"

elif [ "$DB_CHOICE" = "3" ]; then
    DB_PROVIDER="mysql"
    echo ""
    echo " MySQL connection string format:"
    echo "   mysql://USER:PASSWORD@HOST:PORT/DATABASE"
    echo ""
    echo " Examples:"
    echo "   Local:       mysql://kanboard:pass@localhost:3306/kanboard"
    echo "   PlanetScale: mysql://user:pass@host.psdb.cloud/kanboard?ssl={\"rejectUnauthorized\":true}"
    echo "   Railway:     (copy from Railway dashboard Variables tab)"
    echo ""
    echo " See docs/database-setup.md for full setup instructions."
    echo ""
    read -rp " Enter MySQL connection string: " DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
        echo " ERROR: Connection string cannot be empty."
        exit 1
    fi
    echo " OK: MySQL selected"

else
    echo " OK: SQLite selected (default)"
fi

# Update schema.prisma provider if not SQLite
if [ "$DB_PROVIDER" != "sqlite" ]; then
    echo ""
    echo " Updating Prisma schema provider to $DB_PROVIDER..."
    sed -i.bak "s/provider = \"sqlite\"/provider = \"$DB_PROVIDER\"/" prisma/schema.prisma
    rm -f prisma/schema.prisma.bak
    echo " OK: prisma/schema.prisma updated"
fi

# ── 3b. LDAP / Active Directory ──────────────────────────────────────────────
echo ""
echo " ╔══════════════════════════════════════════════════╗"
echo " ║        LDAP / Active Directory Auth             ║"
echo " ╠══════════════════════════════════════════════════╣"
echo " ║  Enable if you have an on-premise AD / LDAP      ║"
echo " ║  server. Leave blank to use local accounts only. ║"
echo " ╚══════════════════════════════════════════════════╝"
echo ""
read -rp " Enable LDAP authentication? [y/N]: " LDAP_ENABLE
LDAP_ENABLE=${LDAP_ENABLE:-n}

LDAP_URI=""
LDAP_BASE_DN=""
LDAP_BIND_DN=""
LDAP_BIND_PASSWORD=""
LDAP_USER_FILTER="(|(sAMAccountName={{username}})(uid={{username}})(userPrincipalName={{username}}))"
LDAP_TLS_REJECT_UNAUTHORIZED="true"

if [[ "$LDAP_ENABLE" =~ ^[Yy]$ ]]; then
    echo ""
    echo " LDAP URI examples:"
    echo "   Active Directory:  ldap://dc.company.com:389"
    echo "   OpenLDAP:          ldap://ldap.company.com:389"
    echo "   LDAPS (TLS):       ldaps://dc.company.com:636"
    echo ""
    read -rp " LDAP server URI (e.g. ldap://dc.company.com:389): " LDAP_URI
    if [ -z "$LDAP_URI" ]; then
        echo " LDAP URI cannot be empty — skipping LDAP setup."
        LDAP_URI=""
    else
        echo ""
        echo " Base DN examples:"
        echo "   dc=company,dc=com"
        echo "   dc=corp,dc=example,dc=org"
        echo ""
        read -rp " Base DN (e.g. dc=company,dc=com): " LDAP_BASE_DN
        if [ -z "$LDAP_BASE_DN" ]; then
            echo " Base DN cannot be empty — skipping LDAP setup."
            LDAP_URI=""
        else
            echo ""
            echo " Service account (optional — for servers that require auth to search):"
            read -rp " Bind DN (leave blank for anonymous bind): " LDAP_BIND_DN
            if [ -n "$LDAP_BIND_DN" ]; then
                read -rsp " Bind password: " LDAP_BIND_PASSWORD
                echo ""
            fi
            echo ""
            echo " User filter — {{username}} is replaced with the entered login."
            echo "   Default covers AD sAMAccountName, uid, and userPrincipalName."
            read -rp " User filter [press Enter for default]: " LDAP_USER_FILTER_INPUT
            if [ -n "$LDAP_USER_FILTER_INPUT" ]; then
                LDAP_USER_FILTER="$LDAP_USER_FILTER_INPUT"
            fi
            echo ""
            read -rp " Reject unauthorized TLS certificates? [Y/n]: " TLS_REJECT
            TLS_REJECT=${TLS_REJECT:-Y}
            if [[ "$TLS_REJECT" =~ ^[Nn]$ ]]; then
                LDAP_TLS_REJECT_UNAUTHORIZED="false"
            fi
            echo " OK: LDAP configured"
        fi
    fi
else
    echo " OK: LDAP disabled — users will authenticate with local accounts"
fi

# ── 4. Set up .env.local ──────────────────────────────────────────────────────
echo ""
echo "[4/6] Setting up environment file..."

if command -v openssl &>/dev/null; then
    SECRET=$(openssl rand -base64 32)
else
    SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
fi

if hostname -I &>/dev/null 2>&1; then
    LAN_IP=$(hostname -I | awk '{print $1}')
else
    LAN_IP="localhost"
fi

if [ ! -f ".env.local" ]; then
    cat > .env.local << ENVEOF
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="${DATABASE_URL}"

# ── NextAuth v5 ───────────────────────────────────────────────────────────────
AUTH_SECRET="${SECRET}"
AUTH_URL="http://${LAN_IP}:3000"
NEXTAUTH_SECRET="${SECRET}"
NEXTAUTH_URL="http://${LAN_IP}:3000"

# ── LDAP / Active Directory ───────────────────────────────────────────────────
LDAP_URI="${LDAP_URI}"
LDAP_BASE_DN="${LDAP_BASE_DN}"
LDAP_BIND_DN="${LDAP_BIND_DN}"
LDAP_BIND_PASSWORD="${LDAP_BIND_PASSWORD}"
LDAP_USER_FILTER="${LDAP_USER_FILTER}"
LDAP_TLS_REJECT_UNAUTHORIZED="${LDAP_TLS_REJECT_UNAUTHORIZED}"

# ── Microsoft Azure AD (SSO) ── leave blank to disable ───────────────────────
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# ── Email (SMTP) ── leave blank to disable ────────────────────────────────────
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Boardly <noreply@boardly.local>"

# ── Browser Push Notifications ── leave blank to disable ─────────────────────
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@boardly.local"

# ── Microsoft Teams ── leave blank to disable ─────────────────────────────────
TEAMS_WEBHOOK_URL=""

# ── MS Graph API (Planner sync) ── leave blank to disable ────────────────────
GRAPH_CLIENT_ID=""
GRAPH_CLIENT_SECRET=""
GRAPH_TENANT_ID=""

# ── Server ────────────────────────────────────────────────────────────────────
PORT=3000
ENVEOF
    echo " OK: .env.local created"
else
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env.local
    rm -f .env.local.bak
    # Update LDAP vars if user configured them
    if [ -n "$LDAP_URI" ]; then
        sed -i.bak "s|^LDAP_URI=.*|LDAP_URI=\"${LDAP_URI}\"|" .env.local
        sed -i.bak "s|^LDAP_BASE_DN=.*|LDAP_BASE_DN=\"${LDAP_BASE_DN}\"|" .env.local
        sed -i.bak "s|^LDAP_BIND_DN=.*|LDAP_BIND_DN=\"${LDAP_BIND_DN}\"|" .env.local
        sed -i.bak "s|^LDAP_BIND_PASSWORD=.*|LDAP_BIND_PASSWORD=\"${LDAP_BIND_PASSWORD}\"|" .env.local
        sed -i.bak "s|^LDAP_USER_FILTER=.*|LDAP_USER_FILTER=\"${LDAP_USER_FILTER}\"|" .env.local
        rm -f .env.local.bak
    fi
    echo " OK: .env.local exists — updated"
fi

# ── 5. Database setup ─────────────────────────────────────────────────────────
echo ""
echo "[5/6] Setting up database schema..."
export DATABASE_URL="$DATABASE_URL"

npx prisma generate --silent

if [ "$DB_PROVIDER" = "sqlite" ]; then
    if [ -f "kanboard.db" ]; then
        echo " Existing database found — applying migrations..."
        npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss
    else
        echo " Creating new database..."
        npx prisma migrate deploy 2>/dev/null || npx prisma db push
        echo " Seeding initial data (admin user, sample workspace)..."
        npx tsx prisma/seed.ts
    fi
else
    echo " Pushing schema to $DB_PROVIDER..."
    npx prisma db push --accept-data-loss
    echo " Seeding initial data (admin user, sample workspace)..."
    npx tsx prisma/seed.ts
fi

echo " OK: Database ready"

# ── 6. Summary ────────────────────────────────────────────────────────────────
echo ""
echo " ╔══════════════════════════════════════════════════╗"
echo " ║               Setup Complete!                    ║"
echo " ╠══════════════════════════════════════════════════╣"
echo " ║                                                  ║"
echo " ║  Default credentials:                            ║"
echo " ║    Email:    admin@boardly.local                 ║"
echo " ║    Password: admin123                            ║"
echo " ║                                                  ║"
echo " ║  Start the server:                               ║"
echo " ║    ./start.sh          (development)             ║"
echo " ║    ./start.sh prod     (production build)        ║"
echo " ║                                                  ║"
if [ "$DB_PROVIDER" != "sqlite" ]; then
echo " ║  Database: $DB_PROVIDER                          ║"
echo " ║  Docs: docs/database-setup.md                   ║"
echo " ║  (backup, pooling, HA, migration guide)          ║"
echo " ║                                                  ║"
fi
echo " ╚══════════════════════════════════════════════════╝"
echo ""
