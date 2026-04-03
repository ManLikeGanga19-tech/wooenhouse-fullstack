#!/bin/bash
# =============================================================================
# Wooden Houses Kenya — Production Deploy Script
# Run on the server via SSH:  bash deploy.sh
# =============================================================================
set -e  # Exit immediately on any error

FRONTEND_DIR="/var/www/woodenhouses-frontend"
BACKEND_DIR="/var/www/woodenhouses-api"
REPO_DIR="/var/www/repo/wooden-houses-kenya"
NODE_VERSION="20"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Wooden Houses Kenya — Production Deploy         ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ─── 1. Pull latest code ───────────────────────────────────────────────────────
echo "▶ Pulling latest code..."
cd "$REPO_DIR"
git pull origin main
echo "✓ Code updated."

# ─── 2. Build C# backend ──────────────────────────────────────────────────────
echo ""
echo "▶ Building C# backend..."
cd "$REPO_DIR/backend/WoodenHousesAPI"
dotnet restore
dotnet publish -c Release -o "$BACKEND_DIR" --no-restore
echo "✓ Backend built → $BACKEND_DIR"

# ─── 3. Build Next.js frontend ────────────────────────────────────────────────
echo ""
echo "▶ Building Next.js frontend..."
cd "$REPO_DIR/frontend"
npm ci --omit=dev
npm run build
echo "✓ Frontend built."

# Copy built output
rsync -av --delete .next/      "$FRONTEND_DIR/.next/"
rsync -av --delete public/     "$FRONTEND_DIR/public/"
cp package.json                "$FRONTEND_DIR/"
cp next.config.js              "$FRONTEND_DIR/"
# Copy node_modules (or install on server)
rsync -av --delete node_modules/ "$FRONTEND_DIR/node_modules/"
cp .next/standalone/server.js  "$FRONTEND_DIR/server.js" 2>/dev/null || true
echo "✓ Frontend deployed → $FRONTEND_DIR"

# ─── 4. Restart services ──────────────────────────────────────────────────────
echo ""
echo "▶ Restarting services..."
sudo systemctl restart woodenhouses-api
sudo systemctl restart woodenhouses-frontend
echo "✓ Services restarted."

# ─── 5. Health check ──────────────────────────────────────────────────────────
echo ""
echo "▶ Running health checks..."
sleep 3

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$API_STATUS" = "200" ]; then
    echo "✓ API health check passed (HTTP $API_STATUS)"
else
    echo "✗ API health check FAILED (HTTP $API_STATUS)"
    echo "  Check logs: sudo journalctl -u woodenhouses-api -n 50"
    exit 1
fi

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✓ Frontend health check passed (HTTP $FRONTEND_STATUS)"
else
    echo "✗ Frontend health check FAILED (HTTP $FRONTEND_STATUS)"
    echo "  Check logs: sudo journalctl -u woodenhouses-frontend -n 50"
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✓ Deploy complete!                              ║"
echo "║   woodenhouseskenya.com is live.                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
