# 🔄 Configuración de n8n - AgroSmart

Guía para configurar n8n con los workflows de automatización del Sistema de Agricultura de Precisión.

---

## 📋 Workflows Disponibles

| Workflow | Archivo | Frecuencia | Descripción |
|----------|---------|------------|-------------|
| **Ingesta Climática** | `workflow-climate-ingest.json` | Cada 6h | Obtiene datos climáticos de OpenWeatherMap y optimiza riego |
| **Predicción de Rendimiento** | `workflow-yield-prediction.json` | Cada 24h | Predice rendimiento con ML y crea alertas si es bajo |
| **Generación de Reportes** | `workflow-report-generation.json` | Webhook | Genera reportes operacionales/gestión en PDF |

---

## 🚀 Instrucciones Rápidas

### Paso 1: Iniciar n8n

```powershell
cd n8n-workflows
docker-compose up -d
```

O espera unos segundos y verifica:
```powershell
docker ps | findstr agrosmart-n8n
```

### Paso 2: Importar Workflows Automáticamente

**Opción A - Doble clic (Windows):**
```
Haz doble clic en → n8n-workflows/import.bat
```

**Opción B - PowerShell:**
```powershell
cd n8n-workflows
.\import-workflows.ps1
```

### Paso 3: Verificar en n8n

1. Abre http://localhost:5678
2. Inicia sesión con:
   - **Email:** `rbustosve@unitru.edu.pe`
   - **Password:** `Ronaldon8n@`
3. Verás los 3 workflows ya **publicados y activos** ✅

---

## 🔧 Configuración Manual (Alternativa)

Si prefieres hacerlo manual:

### 1. Iniciar n8n
```powershell
cd n8n-workflows
docker-compose up
```

### 2. Abrir n8n
- URL: http://localhost:5678
- Usa las credenciales configuradas en `docker-compose.yml`

### 3. Importar Workflows
1. Ve a **Workflows** → **Import from File**
2. Selecciona los archivos `.json` uno por uno:
   - `workflow-climate-ingest.json`
   - `workflow-yield-prediction.json`
   - `workflow-report-generation.json`
3. Haz clic en **Save** para cada workflow
4. Activa el toggle **Active** (arriba a la derecha) para publicarlos

---

## 🔐 Credenciales Configuradas

| Variable | Valor |
|----------|-------|
| **Email** | `rbustosve@unitru.edu.pe` |
| **Password** | `Ronaldon8n@` |
| **Nombre** | Ronaldo Bustos |

Estas credenciales están configuradas en `docker-compose.yml` y se aplican automáticamente al primer arranque.

---

## 📁 Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.yml` | Configuración Docker con credenciales personalizadas |
| `import-workflows.ps1` | Script PowerShell para importación automática |
| `import.bat` | Wrapper para ejecutar con doble clic |
| `workflow-*.json` | Workflows de automatización (3 archivos) |

---

## 🌐 URLs de Conexión

Los workflows se conectan a:
- **Backend API:** http://host.docker.internal:3001/api
- **ML Service:** http://host.docker.internal:5000
- **PostgreSQL:** host.docker.internal:5432

⚠️ **Nota:** Si usas Docker Desktop, `host.docker.internal` resuelve automáticamente a tu máquina host.

---

## 🛠️ Troubleshooting

### "No se puede conectar a n8n"
```powershell
# Verificar que Docker esté corriendo
docker info

# Ver logs
docker logs agrosmart-n8n

# Reiniciar
docker-compose down
docker-compose up -d
```

### "Error de autenticación en importación"
- Espera 10-15 segundos después de iniciar n8n antes de importar
- Verifica las credenciales en `docker-compose.yml`
- Prueba acceder manualmente primero a http://localhost:5678

### Workflows no aparecen activos
- Los workflows deben tener `"active": true` en el JSON (ya configurado)
- El script de importación los activa automáticamente
- O manualmente: Abre cada workflow → Toggle "Active" arriba a la derecha

---

## 📊 Flujo de Datos

```
┌─────────────┐     ┌──────────┐     ┌─────────────┐
│   n8n       │────→│  ML API  │────→│ PostgreSQL  │
│ Workflows   │     │ (Flask)  │     │  (Datos)    │
└─────────────┘     └──────────┘     └─────────────┘
      │
      ↓
┌─────────────┐
│ OpenWeather │
│    API      │
└─────────────┘
```

---

## 📝 Configuración de Credenciales PostgreSQL en n8n

Después de importar, debes configurar la conexión a PostgreSQL:

1. Ve a **Settings** → **Credentials**
2. Crea credencial tipo **PostgreSQL**
3. Configura:
   - Host: `host.docker.internal`
   - Port: `5432`
   - Database: `agricultura_precision`
   - User: `postgres`
   - Password: `sa` (o tu password)

---

**Listo!** Los workflows ahora se ejecutarán automáticamente según sus triggers programados.
