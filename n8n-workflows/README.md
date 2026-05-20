# n8n Workflows - Agricultura de Precisión

## Workflows incluidos

### 1. workflow-climate-ingest.json
**Trigger:** Cada 6 horas (Schedule Trigger)

**Flujo:**
1. Obtiene todos los lotes de la BD (con coordenadas de la finca)
2. Por cada lote: llama a OpenWeatherMap API
3. Valida respuesta (cod == 200)
4. Guarda datos climáticos en tabla `DatoClimatico`
5. Verifica si ya hay optimización de riego para hoy
6. Llama al ML Service (`POST /optimize/water`)
7. Guarda recomendación en tabla `OptimizacionRiego`

**Credenciales necesarias:**
- PostgreSQL connection (tabla `Postgres account 2`)
- OpenWeatherMap API Key (incluida en el nodo como parámetro)

---

### 2. workflow-yield-prediction.json
**Trigger:** Cada 24 horas (Schedule Trigger)

**Flujo:**
1. Obtiene temporadas activas con datos de lote y cultivo
2. Por cada temporada: obtiene últimos 30 días de datos climáticos
3. Obtiene lecturas de sensores (humedad_suelo, temperatura)
4. Llama al ML Service (`POST /predict/yield`)
5. Guarda predicción en tabla `PrediccionRendimiento`
6. Verifica si el rendimiento predicho es < 80% del estimado
7. Si es bajo: crea alerta en tabla `Alerta`

**Credenciales necesarias:**
- PostgreSQL connection
- ML Service corriendo en `http://ml-service:5000` (o `http://localhost:5000`)

---

### 3. workflow-report-generation.json
**Trigger:** Webhook POST en `/webhook/report-generation`

**Flujo:**
1. Recibe parámetros: `report_type`, `lote_id`, `finca_id`, `usuario_id`, `fecha_inicio`
2. Switch según `report_type` (operacional | gestion)
3. Consulta datos relevantes de la BD
4. Genera HTML del reporte
5. Convierte a PDF (nodo HTML)
6. Guarda referencia en tabla `Reporte`
7. Retorna `{ success: true, report_id, message }`

**Llamar desde el backend:**
```http
POST http://localhost:5678/webhook/report-generation
Content-Type: application/json

{
  "report_type": "operacional",
  "lote_id": "uuid-del-lote",
  "usuario_id": "uuid-del-usuario",
  "fecha_inicio": "2024-01-01"
}
```

---

## Importar workflows en n8n

1. Iniciar n8n: `npx n8n` o `n8n start`
2. Abrir http://localhost:5678
3. Ir a **Workflows** → **Import from file**
4. Importar cada archivo `.json`
5. Configurar credenciales PostgreSQL apuntando a tu BD local
6. Activar los workflows deseados

## Credenciales PostgreSQL en n8n

En n8n, crear una credencial de tipo **PostgreSQL** con:
- Host: `localhost`
- Port: `5432`
- Database: `agricultura_precision`
- User: `postgres`
- Password: `sa`
