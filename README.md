# 🌱 AgroSmart - Sistema de Agricultura de Precisión

Sistema de Información de Agricultura de Precisión con predicción de rendimientos via Ensemble Learning y automatización de flujos con n8n.

## 📦 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | NestJS, Prisma ORM |
| Base de Datos | PostgreSQL |
| Machine Learning | Python Flask + scikit-learn (Random Forest + Gradient Boosting) |
| Automatización | n8n workflows |
| Auth | JWT + Passport |

## 🗂️ Estructura del Proyecto

```
precision-agriculture/
├── frontend/              # Next.js 15 App Router
│   └── src/
│       ├── app/           # Páginas (dashboard, lotes, riego, reportes, alertas)
│       ├── components/    # Layout y componentes UI
│       └── lib/           # API client, auth store
│
├── backend/               # NestJS API REST
│   ├── prisma/            # Schema + Seed
│   └── src/
│       ├── auth/          # JWT, guards, strategies
│       ├── users/         # Usuarios
│       ├── farms/         # Fincas
│       ├── plots/         # Lotes (parcelas)
│       ├── crops/         # Cultivos
│       ├── sensors/       # Sensores e IoT
│       ├── irrigation/    # Eventos de riego
│       ├── predictions/   # Predicciones ML
│       ├── reports/       # Generación PDF
│       ├── alerts/        # Sistema de alertas
│       ├── climate/       # Datos climáticos
│       └── dashboard/     # Métricas globales
│
├── ml-service/            # Python Flask - Ensemble Learning
│   ├── app.py             # API REST Flask
│   ├── models/            # Modelos entrenados (.pkl, autogenerado)
│   └── requirements.txt
│
├── n8n-workflows/         # Workflows n8n (JSON)
│   ├── workflow-climate-ingest.json
│   ├── workflow-yield-prediction.json
│   └── workflow-report-generation.json
│
├── setup.sh               # Setup inicial (instala todo)
└── start-all.sh           # Inicia todos los servicios
```

## 🚀 Instalación y Arranque

### Prerequisitos
- Node.js v18+
- Python 3.9+
- PostgreSQL 14+ (corriendo en localhost:5432)
- n8n (opcional, para automatización)

### 1. Configurar PostgreSQL

```bash
# En psql o pgAdmin, crear la base de datos:
CREATE DATABASE agricultura_precision;
# Usuario: postgres, Password: sa
```

O manualmente en terminales separadas:

```bash
# Terminal 1 - ML Service
cd ml-service
pip install -r requirements.txt
C:\Users\Ronaldo\AppData\Local\Programs\Python\Python310\python.exe app.py

# Terminal 2 - Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run start:dev

# Terminal 3 - Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### 4. Importar workflows en n8n (opcional)

cd n8n-workflows && docker-compose up

```bash
# Instalar n8n globalmente si no lo tienes
npm install -g n8n

# Iniciar n8n
n8n start
# Abre http://localhost:5678
# Importar archivos de n8n-workflows/
```

## 🌐 URLs y Accesos

| Servicio | URL | 
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Swagger Docs | http://localhost:3001/api/docs |
| ML Service | http://localhost:5000 |
| n8n | http://localhost:5678 |

### Credenciales de prueba

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Admin | admin@agro.pe | admin123 | ADMIN |
| Operador | operador@agro.pe | operador123 | OPERADOR |

## 🔌 API Endpoints principales

### Auth
```
POST /api/auth/login          # Login → access_token
GET  /api/auth/profile        # Perfil del usuario actual
```

### Dashboard
```
GET /api/dashboard/summary    # Métricas globales
GET /api/dashboard/charts     # Datos para gráficos
```

### Lotes
```
GET    /api/lotes             # Listar lotes
GET    /api/lotes/:id         # Detalle lote
GET    /api/lotes/:id/stats   # Stats completos del lote
POST   /api/lotes             # Crear lote
PUT    /api/lotes/:id         # Actualizar lote
```

### Predicciones ML
```
GET  /api/predicciones/latest         # Últimas predicciones
POST /api/predicciones/trigger        # Disparar nueva predicción
```

### Reportes
```
GET  /api/reportes                    # Listar reportes
POST /api/reportes/operacional        # Generar reporte operacional
POST /api/reportes/gestion            # Generar reporte de gestión
GET  /api/reportes/:id/pdf            # Descargar PDF
```

### ML Service directo
```
GET  http://localhost:5000/health               # Estado del servicio
POST http://localhost:5000/predict/yield        # Predecir rendimiento
POST http://localhost:5000/optimize/water       # Optimizar riego
POST http://localhost:5000/retrain              # Reentrenar modelos
```

## 🤖 Modelos de Machine Learning

El servicio ML implementa un **Ensemble Learning** con dos modelos:

### Predicción de Rendimiento
- **Algoritmo:** VotingRegressor (Random Forest + Gradient Boosting)
- **Features:** área_ha, pH suelo, materia orgánica, temperatura max/min promedio, humedad promedio, precipitación acumulada, días desde trasplante
- **Output:** rendimiento_predicho (kg/ha), intervalo de confianza 95%, precisión del modelo, factores influyentes

### Optimización de Riego
- **Algoritmo:** Random Forest Regressor
- **Features:** humedad actual (%), capacidad de campo, evaporación estimada
- **Output:** recomendación de riego (mm), necesidad calculada, prioridad (alta/media/baja)

Los modelos se entrenan con datos sintéticos al primer arranque y se guardan en `ml-service/models/`. Se pueden reentrenar enviando `POST /retrain`.

## 📋 n8n Workflows

### Workflow 1: Ingesta Climática (cada 6h)
Consulta lotes → llama OpenWeatherMap por coordenadas → guarda en `DatoClimatico` → llama ML para optimización de riego → guarda en `OptimizacionRiego`

### Workflow 2: Predicción de Rendimiento (cada 24h)
Obtiene temporadas activas → recopila datos climáticos + sensores de los últimos 30 días → llama ML → guarda predicción → si rendimiento predicho < 80% del estimado, crea Alerta

### Workflow 3: Generación de Reportes (webhook)
Activado por el backend al solicitar un reporte → consulta datos según tipo → genera HTML → convierte a PDF → guarda referencia en BD → responde con `report_id`

## 🗃️ Modelo de Datos

Entidades principales: `Usuario`, `Finca`, `Lote`, `Cultivo`, `Temporada`, `Sensor`, `LecturaSensor`, `EventoRiego`, `DatoClimatico`, `PrediccionRendimiento`, `OptimizacionRiego`, `Reporte`, `Alerta`

Ver el schema completo en `backend/prisma/schema.prisma`.
