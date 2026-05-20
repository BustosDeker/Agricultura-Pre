# 🌱 AgroSmart - Guía de Ejecución

Este documento explica cómo ejecutar el Sistema de Agricultura de Precisión desde la terminal.

---

## 📋 Prerrequisitos

| Requisito | Versión | Verificación |
|-----------|---------|--------------|
| Node.js | 18+ | `node --version` |
| Python | 3.9+ | `python --version` |
| PostgreSQL | 14+ | Debe estar corriendo en localhost:5432 |
| Docker (opcional) | - | Para n8n |

**Base de datos PostgreSQL:**
```sql
CREATE DATABASE agricultura_precision;
-- Usuario: postgres, Contraseña: sa
```

---

## 🚀 Método 1: Ejecución Rápida (Recomendado)

### Doble clic (Windows)
Simplemente haz **doble clic** en `start.bat` y selecciona una opción:

| Opción | Descripción |
|--------|-------------|
| **1** | Simple - Una terminal con todos los servicios |
| **2** | Simple + n8n - Incluye automatización |
| **3** | Múltiples terminales - Cada servicio separado |

---

## 💻 Método 2: Terminal Manual

### Terminal 1 - ML Service (Python)
```powershell
cd ml-service
pip install -r requirements.txt
python app.py
```

### Terminal 2 - Backend (NestJS)
```powershell
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run start:dev
```

### Terminal 3 - Frontend (Next.js)
```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### Terminal 4 - n8n (Docker)
```powershell
cd n8n-workflows
docker-compose up
```

---

## ⚡ Método 3: PowerShell Scripts

### Una terminal con todos los logs:
```powershell
.\start-simple.ps1
```

### Con n8n incluido:
```powershell
.\start-simple.ps1 -IncludeN8n
```

### Múltiples terminales (una por servicio):
```powershell
.\start-all.ps1
```

---

## 🌐 URLs del Sistema

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interfaz de usuario |
| **Backend API** | http://localhost:3001/api | API REST |
| **Swagger Docs** | http://localhost:3001/api/docs | Documentación API |
| **ML Service** | http://localhost:5000/health | Health check ML |
| **n8n** | http://localhost:5678 | Automatización |

**Credenciales:**
- **Admin:** admin@agro.pe / admin123
- **Operador:** operador@agro.pe / operador123

---

## 📂 Estructura de Archivos

```
precision-agriculture/
├── 📜 start.bat              ← Doble clic para iniciar
├── 📜 start-simple.ps1       ← Script PowerShell simple
├── 📜 start-all.ps1          ← Múltiples terminales
│
├── 🐍 ml-service/            ← Machine Learning (Python)
│   └── app.py
│
├── ⚙️  backend/              ← API REST (NestJS)
│   └── npm run start:dev
│
├── 🌐 frontend/              ← Web App (Next.js)
│   └── npm run dev
│
└── 🔄 n8n-workflows/         ← Automatización (n8n)
    └── docker-compose.yml
```

---

## 🛑 Detener Servicios

### Desde el menú:
Haz doble clic en `start.bat` → Opción 4

### Manualmente:
```powershell
# Detener Node.js
Stop-Process -Name node -Force

# Detener Python
Stop-Process -Name python -Force

# Detener n8n
cd n8n-workflows
docker-compose down
```

---

## 🔧 Troubleshooting

### Error: "node no se reconoce"
```powershell
# Instalar Node.js desde https://nodejs.org
```

### Error: "python no se reconoce"
```powershell
# Asegúrate de tener Python 3.9+ instalado
# Si usas Microsoft Store Python, usa: python3 en lugar de python
```

### Error: "Cannot connect to database"
```powershell
# Verificar que PostgreSQL esté corriendo
pg_isready -h localhost -p 5432
```

### Error: "Port already in use"
```powershell
# Puerto 3000 ocupado
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id <PID>
```

---

## 🎯 Flujo de Trabajo con n8n

Los workflows de n8n automatizan:

1. **Ingesta Climática** (cada 6h)
   - Obtiene datos climáticos por coordenadas
   - Guarda en `DatoClimatico`
   - Optimiza riego automáticamente

2. **Predicción de Rendimiento** (cada 24h)
   - Recopila datos de temporadas activas
   - Llama al servicio ML
   - Crea alertas si rendimiento < 80%

3. **Generación de Reportes** (webhook)
   - Recibe solicitud del backend
   - Genera PDF con datos operacionales
   - Responde con report_id

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en cada terminal
2. Verifica que todos los prerrequisitos estén instalados
3. Comprueba que los puertos 3000, 3001, 5000, 5678 estén libres
