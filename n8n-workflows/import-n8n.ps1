param(
    [string]$N8N_URL = "http://localhost:5678",
    [string]$EMAIL = "rbustosve@unitru.edu.pe", 
    [string]$PASS = "Ronaldon8n@"
)

Write-Host "Importando workflows a n8n..."
Write-Host "URL: $N8N_URL"

# Verificar n8n
Try {
    Invoke-WebRequest -Uri "$N8N_URL/healthz" -Method GET -TimeoutSec 5 | Out-Null
    Write-Host "OK - n8n corriendo" -ForegroundColor Green
} Catch {
    Write-Host "ERROR - Inicia docker-compose up -d primero" -ForegroundColor Red
    exit 1
}

# Login
Try {
    $body = @{emailOrLdapLoginId=$EMAIL; password=$PASS} | ConvertTo-Json
    $resp = Invoke-WebRequest -Uri "$N8N_URL/rest/login" -Method POST -Body $body -ContentType "application/json" -SessionVariable sess
    $session = $sess
    Write-Host "OK - Login exitoso" -ForegroundColor Green
} Catch {
    Write-Host "ERROR Login: $_" -ForegroundColor Red
    exit 1
}

# Importar workflows
$files = @("workflow-climate-ingest.json", "workflow-yield-prediction.json", "workflow-report-generation.json")
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($f in $files) {
    $path = Join-Path $dir $f
    if (!(Test-Path $path)) {
        Write-Host "Archivo no encontrado: $f" -ForegroundColor Red
        continue
    }
    
    Try {
        $json = Get-Content $path -Raw | ConvertFrom-Json
        $payload = @{
            name = $json.name
            nodes = $json.nodes
            connections = $json.connections
            settings = $json.settings
            staticData = $null
            tags = @()
        } | ConvertTo-Json -Depth 100
        
        $resp = Invoke-WebRequest -Uri "$N8N_URL/rest/workflows" -Method POST -Body $payload -ContentType "application/json" -WebSession $session
        $data = $resp.Content | ConvertFrom-Json
        $id = $data.data.id
        
        Write-Host "Creado: $($json.name)" -ForegroundColor Green
        
        if ($json.active -eq $true) {
            $act = @{active=$true} | ConvertTo-Json
            Invoke-WebRequest -Uri "$N8N_URL/rest/workflows/$id" -Method PATCH -Body $act -ContentType "application/json" -WebSession $session | Out-Null
            Write-Host "  Activado" -ForegroundColor Cyan
        }
    } Catch {
        Write-Host "Error con $f : $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "COMPLETADO - Accede a $N8N_URL" -ForegroundColor Green
Write-Host "Email: $EMAIL"
Write-Host "Password: [configurado]"
