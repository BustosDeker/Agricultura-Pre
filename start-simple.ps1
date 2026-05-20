#!/usr/bin/env pwsh
# Script simplificado para iniciar AgroSmart desde UNA terminal con logs

param(
    [switch]$IncludeN8n,
    [switch]$SkipML,
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PYTHONUNBUFFERED = "1"

# Detectar Python
$pythonCmd = "python"
try {
    & python --version 2>$null | Out-Null
} catch {
    $pythonCmd = "python3"
}

# Función para escribir con timestamp
function Write-Log($Service, $Message, $Color = "White") {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] [$Service] $Message" -ForegroundColor $Color
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       🌱 AgroSmart - Iniciando Sistema Completo            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$jobs = @()

# ML Service
if (!$SkipML) {
    Write-Log "ML" "Iniciando ML Service (Flask) en http://localhost:5000..." "Green"
    $mlJob = Start-Job -ScriptBlock {
        param($dir, $python)
        Set-Location $dir
        & $python app.py 2>&1
    } -ArgumentList "$ROOT_DIR\ml-service", $pythonCmd
    $jobs += @{ Name = "ML"; Job = $mlJob }
    Start-Sleep -Seconds 2
}

# Backend
if (!$SkipBackend) {
    Write-Log "API" "Iniciando Backend (NestJS) en http://localhost:3001..." "Green"
    $backendJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        npm run start:dev 2>&1
    } -ArgumentList "$ROOT_DIR\backend"
    $jobs += @{ Name = "API"; Job = $backendJob }
    Start-Sleep -Seconds 3
}

# Frontend
if (!$SkipFrontend) {
    Write-Log "WEB" "Iniciando Frontend (Next.js) en http://localhost:3000..." "Green"
    $frontendJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        npm run dev 2>&1
    } -ArgumentList "$ROOT_DIR\frontend"
    $jobs += @{ Name = "WEB"; Job = $frontendJob }
}

# n8n (Docker)
if ($IncludeN8n) {
    Write-Log "N8N" "Iniciando n8n con Docker en http://localhost:5678..." "Green"
    $n8nJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        docker-compose up 2>&1
    } -ArgumentList "$ROOT_DIR\n8n-workflows"
    $jobs += @{ Name = "N8N"; Job = $n8nJob }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ Servicios iniciados!                      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs disponibles:" -ForegroundColor Cyan
if (!$SkipFrontend) { Write-Host "   • Frontend:    http://localhost:3000" }
if (!$SkipBackend) { Write-Host "   • Backend API: http://localhost:3001/api" }
if (!$SkipBackend) { Write-Host "   • Swagger:     http://localhost:3001/api/docs" }
if (!$SkipML) { Write-Host "   • ML Health:   http://localhost:5000/health" }
if ($IncludeN8n) { Write-Host "   • n8n:         http://localhost:5678" }
Write-Host ""
Write-Host "👤 Credenciales:" -ForegroundColor Cyan
Write-Host "   • Admin:    admin@agro.pe / admin123"
Write-Host "   • Operador: operador@agro.pe / operador123"
Write-Host ""
Write-Host "⚠️  Presiona Ctrl+C para detener todos los servicios" -ForegroundColor Yellow
Write-Host ""

# Mostrar logs en tiempo real
try {
    while ($true) {
        foreach ($j in $jobs) {
            $output = Receive-Job -Job $j.Job
            if ($output) {
                $color = switch ($j.Name) {
                    "ML" { "Green" }
                    "API" { "Blue" }
                    "WEB" { "Magenta" }
                    "N8N" { "Cyan" }
                    default { "White" }
                }
                $output | ForEach-Object { Write-Log $j.Name $_ $color }
            }
        }
        
        # Verificar si algún job murió
        foreach ($j in $jobs) {
            if ($j.Job.State -eq "Failed") {
                Write-Log $j.Name "ERROR: El servicio se detuvo!" "Red"
            }
        }
        
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Deteniendo servicios..." -ForegroundColor Yellow
    foreach ($j in $jobs) {
        Stop-Job -Job $j.Job -ErrorAction SilentlyContinue
        Remove-Job -Job $j.Job -ErrorAction SilentlyContinue
        Write-Log $j.Name "Detenido" "Red"
    }
    if ($IncludeN8n) {
        Set-Location "$ROOT_DIR\n8n-workflows"
        docker-compose down 2>&1 | Out-Null
    }
    Write-Host "✅ Todos los servicios detenidos" -ForegroundColor Green
}
