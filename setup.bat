@echo off
setlocal enabledelayedexpansion

echo.
echo  =====================================================
echo   KanBoard Setup
echo  =====================================================
echo.

:: ── 1. Check Node.js ─────────────────────────────────────────────────────────
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js is not installed.
    echo  Please download and install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  OK: Node.js !NODE_VER! found

:: ── 2. Install dependencies ──────────────────────────────────────────────────
echo.
echo [2/5] Installing dependencies (this may take a minute)...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo  ERROR: npm install failed. Check the output above.
    pause
    exit /b 1
)
echo  OK: Dependencies installed

:: ── 3. Set up .env.local ─────────────────────────────────────────────────────
echo.
echo [3/5] Setting up environment file...
if not exist ".env.local" (
    if exist ".env.local.example" (
        copy ".env.local.example" ".env.local" >nul
        echo  Created .env.local from .env.local.example
    ) else (
        :: Create a minimal .env.local with a generated secret
        for /f "tokens=*" %%s in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"') do set SECRET=%%s
        (
            echo # Database
            echo DATABASE_URL="file:./kanboard.db"
            echo.
            echo # NextAuth v5
            echo AUTH_SECRET="!SECRET!"
            echo AUTH_URL="http://localhost:3000"
            echo NEXTAUTH_SECRET="!SECRET!"
            echo NEXTAUTH_URL="http://localhost:3000"
            echo.
            echo # Microsoft Azure AD ^(SSO - optional^)
            echo AZURE_AD_CLIENT_ID=""
            echo AZURE_AD_CLIENT_SECRET=""
            echo AZURE_AD_TENANT_ID=""
            echo.
            echo # Email SMTP ^(optional^)
            echo SMTP_HOST=""
            echo SMTP_PORT="587"
            echo SMTP_USER=""
            echo SMTP_PASS=""
            echo SMTP_FROM="KanBoard ^<noreply@kanboard.local^>"
            echo.
            echo # Web Push VAPID ^(optional - run: npx web-push generate-vapid-keys^)
            echo VAPID_PUBLIC_KEY=""
            echo VAPID_PRIVATE_KEY=""
            echo VAPID_SUBJECT="mailto:admin@kanboard.local"
            echo.
            echo # Microsoft Teams ^(optional^)
            echo TEAMS_WEBHOOK_URL=""
            echo.
            echo # MS Graph API / Planner ^(optional^)
            echo GRAPH_CLIENT_ID=""
            echo GRAPH_CLIENT_SECRET=""
            echo GRAPH_TENANT_ID=""
            echo.
            echo # Server
            echo PORT=3000
        ) > ".env.local"
        echo  Created .env.local with a generated AUTH_SECRET
    )
) else (
    echo  OK: .env.local already exists ^(skipping^)
)

:: ── 4. Database migration ─────────────────────────────────────────────────────
echo.
echo [4/5] Running database migration...
set DATABASE_URL=file:./kanboard.db
call npx prisma migrate deploy 2>nul
if errorlevel 1 (
    :: Fall back to migrate dev for first-time setup
    call npx prisma migrate dev --name init
    if errorlevel 1 (
        echo  ERROR: Database migration failed.
        pause
        exit /b 1
    )
)
echo  OK: Database schema ready

:: ── 5. Seed default data ─────────────────────────────────────────────────────
echo.
echo [5/5] Seeding default data...
if exist "kanboard.db" (
    echo  Skipping seed — database already exists
) else (
    set DATABASE_URL=file:./kanboard.db
    call npx tsx prisma/seed.ts
    if errorlevel 1 (
        echo  WARNING: Seed failed. You can re-run it later with: npm run db:seed
    ) else (
        echo  OK: Default data seeded
    )
)

:: ── Done ─────────────────────────────────────────────────────────────────────
echo.
echo  =====================================================
echo   Setup complete!
echo  =====================================================
echo.
echo  Default accounts:
echo    Admin   : admin@kanboard.local   / admin123
echo    Manager : manager@kanboard.local / manager123
echo    Member  : member@kanboard.local  / member123
echo.
echo  To start the server, run:
echo    start.bat
echo.
echo  Or directly:
echo    set DATABASE_URL=file:./kanboard.db ^&^& npm run dev
echo.
pause
