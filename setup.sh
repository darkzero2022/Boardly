#!/usr/bin/env bash
set -e

echo ""
echo " ====================================================="
echo "  KanBoard Setup"
echo " ====================================================="
echo ""

# ── 1. Check Node.js ──────────────────────────────────────────────────────────
echo "[1/5] Checking Node.js..."
if ! command -v node &>/dev/null; then
    echo " ERROR: Node.js is not installed."
    echo " Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
NODE_VER=$(node --version)
echo " OK: Node.js $NODE_VER found"

# ── 2. Install dependencies ───────────────────────────────────────────────────
echo ""
echo "[2/5] Installing dependencies..."
npm install --legacy-peer-deps
echo " OK: Dependencies installed"

# ── 3. Set up .env.local ──────────────────────────────────────────────────────
echo ""
echo "[3/5] Setting up environment file..."
if [ ! -f ".env.local" ]; then
    if [ -f ".env.local.example" ]; then
        cp ".env.local.example" ".env.local"
        echo " Created .env.local from .env.local.example"
    else
        SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
        cat > ".env.local" <<EOF
# Database
DATABASE_URL="file:./kanboard.db"

# NextAuth v5
AUTH_SECRET="${SECRET}"
AUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${SECRET}"
NEXTAUTH_URL="http://localhost:3000"

# Microsoft Azure AD (SSO - optional)
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# Email SMTP (optional)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="KanBoard <noreply@kanboard.local>"

# Web Push VAPID (optional - run: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@kanboard.local"

# Microsoft Teams (optional)
TEAMS_WEBHOOK_URL=""

# MS Graph API / Planner (optional)
GRAPH_CLIENT_ID=""
GRAPH_CLIENT_SECRET=""
GRAPH_TENANT_ID=""

# Server
PORT=3000
EOF
        echo " Created .env.local with a generated AUTH_SECRET"
    fi
else
    echo " OK: .env.local already exists (skipping)"
fi

# ── 4. Database migration ─────────────────────────────────────────────────────
echo ""
echo "[4/5] Running database migration..."
export DATABASE_URL="file:./kanboard.db"
if ! npx prisma migrate deploy 2>/dev/null; then
    npx prisma migrate dev --name init
fi
echo " OK: Database schema ready"

# ── 5. Seed default data ──────────────────────────────────────────────────────
echo ""
echo "[5/5] Seeding default data..."
if [ -f "kanboard.db" ]; then
    echo " Skipping seed — database already exists"
else
    export DATABASE_URL="file:./kanboard.db"
    if ! npx tsx prisma/seed.ts; then
        echo " WARNING: Seed failed. Re-run with: npm run db:seed"
    else
        echo " OK: Default data seeded"
    fi
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo " ====================================================="
echo "  Setup complete!"
echo " ====================================================="
echo ""
echo " Default accounts:"
echo "   Admin   : admin@kanboard.local   / admin123"
echo "   Manager : manager@kanboard.local / manager123"
echo "   Member  : member@kanboard.local  / member123"
echo ""
echo " To start the server:"
echo "   ./start.sh         (dev mode)"
echo "   ./start.sh prod    (production mode)"
echo ""
