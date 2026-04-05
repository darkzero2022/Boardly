@echo off
setlocal enabledelayedexpansion

echo.
echo  +==================================================+
echo  ^|         KanBoard Setup ^— v3.0                   ^|
echo  ^|   Self-hosted Team Task Management               ^|
echo  +==================================================+
echo.

:: ── 1. Check Node.js ─────────────────────────────────────────────────────────
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js is not installed.
    echo  Please download Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  OK: Node.js !NODE_VER!

:: ── 2. Install dependencies ───────────────────────────────────────────────────
echo.
echo [2/6] Installing dependencies...
call npm install --legacy-peer-deps --silent
echo  OK: Dependencies installed

:: ── 3. Database selection ─────────────────────────────────────────────────────
echo.
echo  +==================================================+
echo  ^|             Choose Your Database                ^|
echo  +==================================================+
echo  ^|                                                  ^|
echo  ^|  1) SQLite  (default)                            ^|
echo  ^|     - Zero config, file on disk                  ^|
echo  ^|     - Best for: 1-30 users, single server        ^|
echo  ^|     - No installation required                   ^|
echo  ^|                                                  ^|
echo  ^|  2) PostgreSQL  (recommended for enterprise)     ^|
echo  ^|     - Concurrent writes, connection pooling      ^|
echo  ^|     - Best for: 30-500+ users, HA deployments   ^|
echo  ^|     - Supports Supabase, Neon, Railway, RDS      ^|
echo  ^|                                                  ^|
echo  ^|  3) MySQL / MariaDB                              ^|
echo  ^|     - Use if you already run MySQL infrastructure ^|
echo  ^|     - Supports PlanetScale, RDS, Railway         ^|
echo  ^|                                                  ^|
echo  +==================================================+
echo.
set /p DB_CHOICE=" Enter choice [1/2/3] (press Enter for SQLite): "
if "!DB_CHOICE!"=="" set DB_CHOICE=1

set DB_PROVIDER=sqlite
set DATABASE_URL=file:./kanboard.db

if "!DB_CHOICE!"=="2" (
    set DB_PROVIDER=postgresql
    echo.
    echo  PostgreSQL connection string format:
    echo    postgresql://USER:PASSWORD@HOST:PORT/DATABASE
    echo.
    echo  Examples:
    echo    Local:    postgresql://kanboard:pass@localhost:5432/kanboard
    echo    Supabase: postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
    echo    Neon:     postgresql://user:pass@ep-xxx.neon.tech/kanboard?sslmode=require
    echo    Railway:  ^(copy from Railway dashboard Variables tab^)
    echo.
    echo  See docs\database-setup.md for full setup instructions.
    echo.
    set /p DATABASE_URL=" Enter PostgreSQL connection string: "
    if "!DATABASE_URL!"=="" (
        echo  ERROR: Connection string cannot be empty.
        pause
        exit /b 1
    )
    echo  OK: PostgreSQL selected

) else if "!DB_CHOICE!"=="3" (
    set DB_PROVIDER=mysql
    echo.
    echo  MySQL connection string format:
    echo    mysql://USER:PASSWORD@HOST:PORT/DATABASE
    echo.
    echo  Examples:
    echo    Local:    mysql://kanboard:pass@localhost:3306/kanboard
    echo    Railway:  ^(copy from Railway dashboard Variables tab^)
    echo.
    echo  See docs\database-setup.md for full setup instructions.
    echo.
    set /p DATABASE_URL=" Enter MySQL connection string: "
    if "!DATABASE_URL!"=="" (
        echo  ERROR: Connection string cannot be empty.
        pause
        exit /b 1
    )
    echo  OK: MySQL selected

) else (
    echo  OK: SQLite selected ^(default^)
)

:: Update schema.prisma provider if not SQLite
if not "!DB_PROVIDER!"=="sqlite" (
    echo.
    echo  Updating Prisma schema provider to !DB_PROVIDER!...
    powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"sqlite\"', 'provider = \"!DB_PROVIDER!\"' | Set-Content prisma\schema.prisma"
    echo  OK: prisma\schema.prisma updated
)

:: ── 4. Set up .env.local ──────────────────────────────────────────────────────
echo.
echo [4/6] Setting up environment file...

:: Generate random secret
for /f "tokens=*" %%s in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"') do set SECRET=%%s

:: Get LAN IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LAN_IP=%%a
    set LAN_IP=!LAN_IP: =!
    goto :gotip
)
:gotip
if "!LAN_IP!"=="" set LAN_IP=localhost

if not exist ".env.local" (
    (
        echo # -- Database ------------------------------------------------------------------
        echo DATABASE_URL="!DATABASE_URL!"
        echo.
        echo # -- NextAuth v5 ---------------------------------------------------------------
        echo AUTH_SECRET="!SECRET!"
        echo AUTH_URL="http://!LAN_IP!:3000"
        echo NEXTAUTH_SECRET="!SECRET!"
        echo NEXTAUTH_URL="http://!LAN_IP!:3000"
        echo.
        echo # -- Microsoft Azure AD ^(SSO^) -- leave blank to disable -----------------------
        echo AZURE_AD_CLIENT_ID=""
        echo AZURE_AD_CLIENT_SECRET=""
        echo AZURE_AD_TENANT_ID=""
        echo.
        echo # -- Email ^(SMTP^) -- leave blank to disable -----------------------------------
        echo SMTP_HOST=""
        echo SMTP_PORT="587"
        echo SMTP_USER=""
        echo SMTP_PASS=""
        echo SMTP_FROM="KanBoard ^<noreply@kanboard.local^>"
        echo.
        echo # -- Browser Push Notifications -- leave blank to disable ---------------------
        echo VAPID_PUBLIC_KEY=""
        echo VAPID_PRIVATE_KEY=""
        echo VAPID_SUBJECT="mailto:admin@kanboard.local"
        echo.
        echo # -- Microsoft Teams -- leave blank to disable --------------------------------
        echo TEAMS_WEBHOOK_URL=""
        echo.
        echo # -- MS Graph API ^(Planner sync^) -- leave blank to disable ------------------
        echo GRAPH_CLIENT_ID=""
        echo GRAPH_CLIENT_SECRET=""
        echo GRAPH_TENANT_ID=""
        echo.
        echo # -- Server -------------------------------------------------------------------
        echo PORT=3000
    ) > .env.local
    echo  OK: .env.local created
) else (
    powershell -Command "(Get-Content .env.local) -replace '^DATABASE_URL=.*', 'DATABASE_URL=\"!DATABASE_URL!\"' | Set-Content .env.local"
    echo  OK: .env.local exists -- DATABASE_URL updated
)

:: ── 5. Database setup ─────────────────────────────────────────────────────────
echo.
echo [5/6] Setting up database schema...
set DATABASE_URL=!DATABASE_URL!

call npx prisma generate --silent

if "!DB_PROVIDER!"=="sqlite" (
    if exist "kanboard.db" (
        echo  Existing database found -- applying migrations...
        call npx prisma migrate deploy 2>nul || call npx prisma db push --accept-data-loss
    ) else (
        echo  Creating new database...
        call npx prisma migrate deploy 2>nul || call npx prisma db push
        echo  Seeding initial data...
        call npx tsx prisma/seed.ts
    )
) else (
    echo  Pushing schema to !DB_PROVIDER!...
    call npx prisma db push --accept-data-loss
    echo  Seeding initial data...
    call npx tsx prisma/seed.ts
)
echo  OK: Database ready

:: ── 6. Summary ────────────────────────────────────────────────────────────────
echo.
echo  +==================================================+
echo  ^|              Setup Complete!                     ^|
echo  +==================================================+
echo  ^|                                                  ^|
echo  ^|  Default credentials:                            ^|
echo  ^|    Email:    admin@kanboard.local                ^|
echo  ^|    Password: admin123                            ^|
echo  ^|                                                  ^|
echo  ^|  Start the server:                               ^|
echo  ^|    start.bat            ^(development^)            ^|
echo  ^|    start.bat prod       ^(production build^)       ^|
echo  ^|                                                  ^|
if not "!DB_PROVIDER!"=="sqlite" (
echo  ^|  Database: !DB_PROVIDER!                         ^|
echo  ^|  Docs: docs\database-setup.md                   ^|
echo  ^|  ^(backup, pooling, HA, migration guide^)         ^|
echo  ^|                                                  ^|
)
echo  +==================================================+
echo.
pause
