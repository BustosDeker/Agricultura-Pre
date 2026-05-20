# 🌱 Guía para Nuevos Desarrolladores - AgroSmart

> **⚡ Inicio rápido:** Si ya tienes todo instalado (Node, Python, PostgreSQL, Docker), ve directo a la [Sección 4: Primer Arranque](#4-primer-arranque)

---

## 📋 1. Requisitos Previos (Instalar ANTES de descomprimir)

Antes de abrir el proyecto, asegúrate de tener instalado:

| Software | Versión Mínima | Link de Descarga | Verificación |
|----------|----------------|------------------|--------------|
| **Node.js** | 18+ | https://nodejs.org | `node --version` |
| **Python** | 3.9+ | https://python.org | `python --version` |
| **PostgreSQL** | 14+ | https://postgresql.org | `psql --version` |
| **Docker Desktop** | Latest | https://docker.com | `docker --version` |
| **Git** (opcional) | - | https://git-scm.com | `git --version` |

### 💡 Tips de Instalación

- **Windows:** Durante la instalación de Python, **marca la casilla** "Add Python to PATH"
- **PostgreSQL:** Anota el password del usuario `postgres` que configures (se necesita luego)
- **Docker Desktop:** Reinicia la PC después de instalarlo

---

## 🗂️ 2. Descomprimir el Proyecto

1. Descarga el archivo `.zip` / `.rar` del proyecto
2. Descomprímelo en una carpeta sin espacios ni tildes, ejemplo:
   ```
   ✅ C:\Proyectos\precision-agriculture
   ❌ C:\Mis Documentos\proyecto agricultura (tildes y espacios)
   ```

---

## 🐘 3. Crear la Base de Datos PostgreSQL

### Método 1: Con pgAdmin (Recomendado para principiantes)

1. Abre **pgAdmin 4** (se instala con PostgreSQL)
2. En el árbol izquierdo, expande `Servers` → `PostgreSQL` → `Databases`
3. Click derecho en `Databases` → `Create` → `Database`
4. En el campo **Database**, escribe: `agricultura_precision`
5. Click en **Save**

### Método 2: Con línea de comandos (psql)

```bash
# Abre cmd o PowerShell y ejecuta:
psql -U postgres -c "CREATE DATABASE agricultura_precision;"
```

Cuando pida password, ingresa el que configuraste al instalar PostgreSQL.

### ⚠️ Configuración Importante

Asegúrate de que tu PostgreSQL tenga estas credenciales (o modifícalas en `backend/.env`):

```
Usuario: postgres
Password: sa
Host: localhost
Puerto: 5432
Database: agricultura_precision
```

---

## 🚀 4. Primer Arranque

Abre **PowerShell** o **CMD** en la carpeta del proyecto y ejecuta:

### Opción A: Doble clic (Windows)

Haz **doble clic** en el archivo `start.bat` y selecciona la opción deseada:

| Opción | Descripción |
|--------|-------------|
| **1** | **Simple** - Una sola terminal con todos los servicios (Recomendado) |
| **2** | **Simple + n8n** - Incluye Docker con automatización |
| **3** | **Múltiples terminales** - Cada servicio en ventana separada |
| **4** | Detener todos los servicios |

### Opción B: Línea de comandos

```powershell
# Desde la carpeta del proyecto
.\start-simple.ps1
```

O con n8n incluido:

```powershell
.\start-simple.ps1 -IncludeN8n
```

---

## 🔄 5. Configurar n8n (Docker)

Si elegiste la opción con n8n, sigue estos pasos:

### Paso 1: Iniciar Docker

```powershell
cd n8n-workflows
docker-compose up -d
```

Espera 10-15 segundos a que n8n arranque.

### Paso 2: Importar Workflows Automáticamente

```powershell
# En PowerShell, desde la carpeta n8n-workflows
.\import-n8n.ps1
```

O simplemente haz **doble clic** en `import.bat`

### Paso 3: Verificar

1. Abre http://localhost:5678
2. Inicia sesión con:
   - **Email:** `rbustosve@unitru.edu.pe`
   - **Password:** `Ronaldon8n@`
3. Deberías ver **3 workflows activos** ✅

### Paso 4: Configurar Credenciales PostgreSQL en n8n

1. En n8n, ve a **Settings** → **Credentials**
2. Crea una credencial tipo **PostgreSQL**
3. Configura:
   - Host: `host.docker.internal`
   - Port: `5432`
   - Database: `agricultura_precision`
   - User: `postgres`
   - Password: `sa` (o tu password de PostgreSQL)

---

## 🌐 6. Verificar que Todo Funciona

Abre tu navegador y verifica estas URLs:

| Servicio | URL | ¿Debe mostrar? |
|----------|-----|----------------|
| **Frontend** | http://localhost:3000 | Login de AgroSmart |
| **Backend** | http://localhost:3001/api/docs | Swagger UI (documentación API) |
| **ML Service** | http://localhost:5000/health | `{"status":"healthy"}` |
| **n8n** | http://localhost:5678 | Panel de n8n |

### Credenciales de Prueba

```
Admin:     admin@agro.pe     / admin123
Operador:  operador@agro.pe  / operador123
```

---

## 🛠️ 7. Solución de Problemas Comunes

### "No se reconoce node/python/psql"

**Causa:** No están en el PATH del sistema

**Solución:**
1. Cierra y vuelve a abrir PowerShell/CMD
2. Si persiste, reinstala el programa marcando "Add to PATH"

### "Cannot connect to database" / "ECONNREFUSED 127.0.0.1:5432"

**Causa:** PostgreSQL no está corriendo

**Solución:**
```powershell
# Verificar si PostgreSQL está activo
pg_isready -h localhost -p 5432

# Si dice "no response", inicia el servicio:
# - Windows: Servicios → postgresql-x64 → Iniciar
# - O reinicia tu PC
```

### "Port already in use" (Puerto ocupado)

**Causa:** Otro programa usa el puerto 3000, 3001, 5000 o 5678

**Solución:**
```powershell
# Encontrar qué proceso ocupa el puerto (ejemplo: 3000)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Matar el proceso
Stop-Process -Id <PID> -Force
```

### Error al importar workflows de n8n

**Causa:** n8n aún no ha terminado de iniciar

**Solución:**
```powershell
# Ver logs de n8n
docker logs agrosmart-n8n

# Espera 15 segundos más e intenta de nuevo
.\import-n8n.ps1
```

### "docker-compose no se reconoce"

**Causa:** Docker Desktop no está instalado o no se reinició

**Solución:**
1. Verifica que Docker Desktop esté corriendo (icono en la bandeja)
2. Si no funciona, reinicia la PC

---

## 📁 Estructura del Proyecto (para referencia)

```
precision-agriculture/
├── 📜 GUÍA_NUEVO_DESARROLLADOR.md  ← Estás aquí
├── 📜 start.bat                    ← Doble clic para iniciar
├── 📜 start-simple.ps1             ← Script PowerShell simple
├── 📜 EJECUTAR.md                  ← Guía de ejecución detallada
├── 📜 N8N_SETUP.md                 ← Configuración específica de n8n
│
├── 🐍 ml-service/                  ← Machine Learning (Python)
│   ├── app.py
│   └── requirements.txt
│
├── ⚙️ backend/                     ← API REST (NestJS)
│   ├── prisma/schema.prisma        ← Modelo de datos
│   └── src/                        ← Código fuente
│
├── 🌐 frontend/                    ← Web App (Next.js)
│   └── src/
│
└── 🔄 n8n-workflows/               ← Automatización (n8n)
    ├── docker-compose.yml
    ├── import-n8n.ps1
    └── workflow-*.json             ← Workflows de ejemplo
```

---

## ✅ Checklist de Instalación

Antes de empezar a desarrollar, verifica:

- [ ] Node.js instalado (`node --version` muestra v18+)
- [ ] Python instalado (`python --version` muestra 3.9+)
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `agricultura_precision` creada
- [ ] Docker Desktop instalado (si usarás n8n)
- [ ] Proyecto descomprimido en ruta sin espacios
- [ ] `start.bat` ejecutado sin errores
- [ ] Frontend carga en http://localhost:3000
- [ ] Backend responde en http://localhost:3001/api/docs
- [ ] (Opcional) Workflows de n8n importados

---

## 🆘 ¿Aún tienes problemas?

1. **Revisa los logs:** Cada servicio muestra errores en su terminal
2. **Verifica puertos:** Asegúrate que 3000, 3001, 5000, 5432, 5678 estén libres
3. **Consulta:** `EJECUTAR.md` para troubleshooting avanzado
4. **n8n específico:** Consulta `N8N_SETUP.md` para problemas de automatización

---

**¡Listo!** Una vez completados estos pasos, el sistema debería estar funcionando correctamente. 🎉
