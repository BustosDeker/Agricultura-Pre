#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[AgroSmart]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   AgroSmart - Setup Inicial              ║${NC}"
echo -e "${GREEN}║   Sistema de Agricultura de Precisión    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

# Verificar prerequisitos
log "Verificando prerequisitos..."

command -v node >/dev/null 2>&1 || error "Node.js no encontrado. Instalar desde https://nodejs.org (v18+)"
command -v npm >/dev/null 2>&1 || error "npm no encontrado"
command -v python3 >/dev/null 2>&1 || error "Python 3 no encontrado"
command -v psql >/dev/null 2>&1 || warn "psql no encontrado - asegúrate que PostgreSQL esté corriendo"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js v18+ requerido. Versión actual: $(node -v)"
fi

info "Node.js $(node -v) ✓"
info "Python $(python3 --version) ✓"

# ─── 1. Base de datos ───────────────────────────────────────────────
log "Configurando base de datos PostgreSQL..."
echo "Asegúrate que PostgreSQL esté corriendo en localhost:5432"
echo "Usuario: postgres, Password: sa, DB: agricultura_precision"
echo ""

# Crear la base de datos si no existe
psql -U postgres -c "CREATE DATABASE agricultura_precision;" 2>/dev/null && \
    info "Base de datos 'agricultura_precision' creada" || \
    info "Base de datos ya existe"

# ─── 2. Backend ─────────────────────────────────────────────────────
log "Instalando dependencias del backend..."
cd backend
npm install

log "Generando cliente Prisma..."
npx prisma generate

log "Ejecutando migraciones..."
npx prisma db push

log "Ejecutando seed de datos iniciales..."
npx ts-node prisma/seed.ts

cd ..

# ─── 3. Frontend ────────────────────────────────────────────────────
log "Instalando dependencias del frontend..."
cd frontend
npm install
cd ..

# ─── 4. ML Service ──────────────────────────────────────────────────
log "Configurando servicio de ML (Python)..."
cd ml-service
python3 -m pip install -r requirements.txt --quiet
cd ..

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Setup completado exitosamente       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo "  1. Ejecutar: ${GREEN}./start-all.sh${NC}   (inicia todos los servicios)"
echo "  2. O iniciar cada servicio manualmente:"
echo "     • Backend:   cd backend && npm run start:dev"
echo "     • Frontend:  cd frontend && npm run dev"
echo "     • ML:        cd ml-service && python3 app.py"
echo ""
echo -e "${BLUE}URLs disponibles:${NC}"
echo "  🌐 Frontend:  http://localhost:3000"
echo "  ⚙️  Backend:   http://localhost:3001"
echo "  📚 Swagger:   http://localhost:3001/api/docs"
echo "  🤖 ML:        http://localhost:5000"
echo ""
echo -e "${BLUE}Credenciales:${NC}"
echo "  Admin:    admin@agro.pe     / admin123"
echo "  Operador: operador@agro.pe  / operador123"
echo ""
