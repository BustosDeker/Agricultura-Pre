#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[AgroSmart]${NC} $1"; }

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Función de limpieza al salir (Ctrl+C)
cleanup() {
    echo ""
    log "Deteniendo todos los servicios..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   AgroSmart - Iniciando servicios        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ─── ML Service ─────────────────────────────────────────────────────
log "🤖 Iniciando ML Service (Python Flask)..."
cd "$ROOT_DIR/ml-service"
python3 app.py > /tmp/agro-ml.log 2>&1 &
ML_PID=$!
echo "   ML Service PID: $ML_PID → http://localhost:5000"
sleep 3

# ─── Backend NestJS ─────────────────────────────────────────────────
log "⚙️  Iniciando Backend NestJS..."
cd "$ROOT_DIR/backend"
npm run start:dev > /tmp/agro-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID → http://localhost:3001"
sleep 5

# ─── Frontend Next.js ───────────────────────────────────────────────
log "🌐 Iniciando Frontend Next.js..."
cd "$ROOT_DIR/frontend"
npm run dev > /tmp/agro-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID → http://localhost:3000"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Todos los servicios iniciados          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}URLs:${NC}"
echo "  🌐 Frontend:  http://localhost:3000"
echo "  ⚙️  Backend:   http://localhost:3001/api"
echo "  📚 Swagger:   http://localhost:3001/api/docs"
echo "  🤖 ML:        http://localhost:5000/health"
echo ""
echo -e "${BLUE}Logs en tiempo real:${NC}"
echo "  ML:       tail -f /tmp/agro-ml.log"
echo "  Backend:  tail -f /tmp/agro-backend.log"
echo "  Frontend: tail -f /tmp/agro-frontend.log"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Mantener el script corriendo
wait
