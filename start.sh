#!/usr/bin/env bash
set -e

MODE="${1:-dev}"

echo ""
echo " Boardly — starting server (${MODE} mode)..."
echo ""

# Verify prerequisites
if [ ! -f ".env.local" ]; then
    echo " ERROR: .env.local not found. Please run ./setup.sh first."
    exit 1
fi
if [ ! -d "node_modules" ]; then
    echo " ERROR: node_modules not found. Please run ./setup.sh first."
    exit 1
fi

# Display LAN IP
LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || \
         ipconfig getifaddr en0 2>/dev/null || \
         echo "your-machine-ip")

echo " Local :  http://localhost:3000"
if [ -n "$LAN_IP" ] && [ "$LAN_IP" != "your-machine-ip" ]; then
    echo " LAN   :  http://${LAN_IP}:3000"
fi
echo ""
echo " Press Ctrl+C to stop."
echo ""

export DATABASE_URL="file:./kanboard.db"

if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    echo " Building for production..."
    npm run build
    echo ""
    NODE_ENV=production npm start
else
    npm run dev
fi
