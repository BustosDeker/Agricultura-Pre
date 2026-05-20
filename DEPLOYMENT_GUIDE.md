# 🚀 Guía Completa de Despliegue - Sistema de Agricultura de Precisión

## 📋 Índice
1. [Preparación](#preparación)
2. [Configuración de Neon PostgreSQL](#configuración-de-neon-postgresql)
3. [Despliegue del Backend en Render](#despliegue-del-backend-en-render)
4. [Despliegue del Frontend en Vercel](#despliegue-del-frontend-en-vercel)
5. [Configuración de n8n con Docker](#configuración-de-n8n-con-docker)
6. [Configuración del Servicio ML (Opcional)](#configuración-del-servicio-ml-opcional)
7. [Configuración de GitHub Actions CI/CD](#configuración-de-github-actions-cicd)
8. [Verificación Final](#verificación-final)

---

## 1. Preparación <a name="preparación"></a>

### 📦 Requisitos previos
- Cuenta en [GitHub](https://github.com)
- Cuenta en [Neon](https://neon.tech) (PostgreSQL)
- Cuenta en [Render](https://render.com) (Backend)
- Cuenta en [Vercel](https://vercel.com) (Frontend)
- Docker y Docker Compose instalados (para n8n)
- Git instalado

### 🔄 Subir el proyecto a GitHub

1. Inicializa el repositorio (si no lo está):
```bash
cd c:\Users\Ronaldo\Notas\precision-agriculture
git init
```

2. Crea un archivo `.gitignore` (si no existe):
```gitignore
# Dependencies
node_modules/
ml-service/venv/
ml-service/__pycache__/
ml-service/models/*.pkl

# Build outputs
.next/
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# n8n
n8n-workflows/n8n_data/
```

3. Agrega los archivos y haz commit:
```bash
git add .
git commit -m "Initial commit - Precision Agriculture System"
```

4. Crea un repositorio en GitHub y sube el código:
```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

---

## 2. Configuración de Neon PostgreSQL <a name="configuración-de-neon-postgresql"></a>

### Paso 1: Crear base de datos en Neon
1. Ve a [Neon](https://neon.tech) y crea una cuenta
2. Crea un nuevo proyecto
3. Nombra tu base de datos: `agricultura_precision`
4. Copia la URL de conexión (se verá así):
   ```
   postgresql://usuario:contraseña@ep-nombre-123456.us-east-2.aws.neon.tech/agricultura_precision?sslmode=require
   ```

### Paso 2: Guardar credenciales
Guarda esta URL, la necesitarás para Render y para configurar Prisma.

---

## 3. Despliegue del Backend en Render <a name="despliegue-del-backend-en-render"></a>

### Paso 1: Crear Web Service en Render
1. Ve a [Render](https://render.com) y conecta tu cuenta de GitHub
2. Haz clic en **New +** → **Web Service**
3. Selecciona tu repositorio de GitHub
4. Configura el servicio:
   - **Name**: `agrosmart-backend`
   - **Region**: Selecciona la más cercana a ti
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free (Starter)

### Paso 2: Configurar Variables de Entorno
En la sección **Environment**, agrega las siguientes variables:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu URL de Neon PostgreSQL |
| `JWT_SECRET` | Genera una clave segura (ej: `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render usa este puerto por defecto) |
| `ML_SERVICE_URL` | (Opcional) URL de tu servicio ML |
| `FRONTEND_URL` | URL de tu frontend en Vercel (lo obtendrás después) |

### Paso 3: Desplegar
Haz clic en **Create Web Service** y espera a que termine el despliegue.

### Paso 4: Ejecutar migraciones y seed
Una vez el servicio esté activo, abre un **Shell** en Render y ejecuta:
```bash
cd backend
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
```

### Paso 5: Obtener URL del Backend
Copia la URL de tu backend (ej: `https://agrosmart-backend.onrender.com`), la necesitarás para Vercel.

---

## 4. Despliegue del Frontend en Vercel <a name="despliegue-del-frontend-en-vercel"></a>

### Paso 1: Importar proyecto en Vercel
1. Ve a [Vercel](https://vercel.com) y conecta tu cuenta de GitHub
2. Haz clic en **Add New...** → **Project**
3. Importa tu repositorio de GitHub
4. Configura el proyecto:
   - **Project Name**: `agrosmart-frontend`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`

### Paso 2: Configurar Variables de Entorno
En la sección **Environment Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | URL de tu backend en Render (ej: `https://agrosmart-backend.onrender.com/api`) |

### Paso 3: Desplegar
Haz clic en **Deploy** y espera a que termine.

### Paso 4: Actualizar variable en Render
Vuelve a Render y actualiza la variable `FRONTEND_URL` con la URL de tu frontend en Vercel.

---

## 5. Configuración de n8n con Docker <a name="configuración-de-n8n-con-docker"></a>

### Paso 1: Iniciar n8n
El proyecto ya incluye un `docker-compose.yml` en la carpeta `n8n-workflows/`.

```bash
cd n8n-workflows
docker-compose up -d
```

### Paso 2: Acceder a n8n
Abre tu navegador y ve a: `http://localhost:5678`

### Paso 3: Credenciales predeterminadas
- **Email**: `rbustosve@unitru.edu.pe`
- **Password**: `Ronaldon8n@`

*(Puedes cambiar estas credenciales en el archivo `docker-compose.yml`)*

### Paso 4: Importar Workflows
1. En n8n, ve a **Workflows** → **Import from File**
2. Importa los archivos JSON de la carpeta `n8n-workflows/`
3. Configura los credenciales para PostgreSQL (usa tu URL de Neon)
4. Actualiza las URLs de webhook para que apunten a tu backend en Render

---

## 6. Configuración del Servicio ML (Opcional) <a name="configuración-del-servicio-ml-opcional"></a>

Si quieres desplegar el servicio ML, puedes usar:
- **Render** (con environment Python)
- **Railway**
- **Fly.io**

### Variables de entorno para ML Service:
| Variable | Valor |
|----------|-------|
| `PORT` | `5000` |

---

## 7. Configuración de GitHub Actions CI/CD <a name="configuración-de-github-actions-cicd"></a>

### Paso 1: Agregar Secrets en GitHub
Ve a tu repositorio → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Agrega los siguientes secrets:

| Secret | Valor |
|--------|-------|
| `VERCEL_TOKEN` | Obtén tu token en [Vercel Settings](https://vercel.com/account/tokens) |
| `RENDER_DEPLOY_HOOK` | Obtén tu hook en Render → Settings → Deploy Hooks |
| `DATABASE_URL` | Tu URL de Neon PostgreSQL |
| `JWT_SECRET` | La misma clave que usaste en Render |
| `NEXT_PUBLIC_API_URL` | URL de tu backend |

### Paso 2: Verificar workflows
Los workflows ya están creados en `.github/workflows/`:
- `frontend.yml`: Se ejecuta cuando hay cambios en `frontend/` → despliega a Vercel
- `backend.yml`: Se ejecuta cuando hay cambios en `backend/` → despliega a Render

---

## 8. Verificación Final <a name="verificación-final"></a>

### ✅ Checklist de despliegue
- [ ] Repositorio subido a GitHub
- [ ] Base de datos Neon creada y accesible
- [ ] Backend desplegado en Render y responding
- [ ] Frontend desplegado en Vercel y accesible
- [ ] n8n corriendo con Docker
- [ ] GitHub Secrets configurados
- [ ] CI/CD pipelines funcionando

### 🔍 Probar la aplicación
1. Abre tu frontend en Vercel
2. Inicia sesión con las credenciales de prueba:
   - **Email**: `admin@agro.pe`
   - **Password**: `admin123`
3. Navega por el dashboard y verifica que todo funcione

---

## 📞 Soporte
Si tienes problemas:
1. Revisa los logs en Render y Vercel
2. Verifica las variables de entorno
3. Asegúrate de que la base de datos esté accesible
4. Revisa la consola del navegador para errores en el frontend

---

## 🔐 Variables de Entorno Resumen

### Backend (Render)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu-clave-segura
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=10000
ML_SERVICE_URL=http://localhost:5000
FRONTEND_URL=https://tu-frontend.vercel.app
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com/api
```

¡Felicidades! Tu Sistema de Agricultura de Precisión está listo para usarse. 🎉
