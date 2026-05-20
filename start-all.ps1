#!/usr/bin/env pwsh
#requires -Version 5.1

<#
.SYNOPSIS
    Script para iniciar todos los servicios de AgroSmart en Windows
.DESCRIPTION
    Inicia ML Service, Backend NestJS, Frontend Next.js y n8n (Docker)
    desde terminales separados para facilitar el monitoreo
.EXAMPLE
    .\start-all.ps1
#>

$ErrorActionPreference = "Stop"
$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

# Colores
function Write-Color($Text, $Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

function Write-Success($Text) { Write-Color "[✓] $Text" "Green" }
function Write-Info($Text) { Write-Color "[ℹ] $Text" "Cyan" }
function Write-Warning($Text) { Write-Color "[!] $Text" "Yellow" }

# Banner
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     🌱 AgroSmart - Sistema de Agricultura de Precisión   ║" -ForegroundColor Green
Write-Host "║               Iniciando Servicios...                     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Verificar prerequisitos
Write-Info "Verificando prerequisitos..."

# Verificar Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Warning "Node.js no está instalado. Por favor instálalo desde https://nodejs.org"
    exit 1
}

# Verificar Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    if (!(Get-Command python3 -ErrorAction SilentlyContinue)) {
        Write-Warning "Python no está instalado. Por favor instálalo"
        exit 1
    }
}

# Verificar Docker para n8n
$hasDocker = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        docker info | Out-Null
        $hasDocker = $true
        Write-Success "Docker detectado"
    } catch {
        Write-Warning "Docker no está corriendo. n8n no se iniciará."
    }
}

Write-Success "Prerequisitos verificados"
Write-Host ""

# Función para iniciar proceso en nueva terminal
function Start-ServiceTerminal {
    param(
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command,
        [string]$WindowStyle = "Normal"
    )
    
    $wtAvailable = $false
    try {
        $wtVersion = wt --version 2>$null
        $wtAvailable = $true
    } catch { }
    
    if ($wtAvailable) {
        # Windows Terminal
        $splitCmd = $Command -split " "
        $exe = $splitCmd[0]
        $args = $splitCmd[1..($splitCmd.Length-1)] -join " "
        
        Start-Process wt -ArgumentList "--title `"$Title`" -d `"$WorkingDirectory`" $exe $args" -WindowStyle $WindowStyle
    } else {
        # PowerShell normal
        $psCmd = "Set-Location '$WorkingDirectory'; Write-Host 'Iniciando $Title...' -ForegroundColor Green; $Command"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $psCmd -WindowStyle $WindowStyle
    }
}

# ============================================================================
# INICIAR SERVICIOS
# ============================================================================

Write-Info "🤖 Iniciando ML Service (Python Flask) en Terminal 1..."
$pythonCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { "python3" }
Start-ServiceTerminal -Title "🤖 ML Service - AgroSmart" -WorkingDirectory "$ROOT_DIR\ml-service" -Command "$pythonCmd app.py"
Start-Sleep -Seconds 3

Write-Info "⚙️  Iniciando Backend NestJS en Terminal 2..."
Start-ServiceTerminal -Title "⚙️  Backend - AgroSmart" -WorkingDirectory "$ROOT_DIR\backend" -Command "npm run start:dev"
Start-Sleep -Seconds 5

Write-Info "🌐 Iniciando Frontend Next.js en Terminal 3..."
Start-ServiceTerminal -Title "🌐 Frontend - AgroSmart" -WorkingDirectory "$ROOT_DIR\frontend" -Command "npm run dev"

# Iniciar n8n si Docker está disponible
if ($hasDocker) {
    Write-Info "🔄 Iniciando n8n (Docker) en Terminal 4..."
    
    if (Test-Path "$ROOT_DIR\n8n-workflows\docker-compose.yml") {
        Start-ServiceTerminal -Title "🔄 n8n - AgroSmart" -WorkingDirectory "$ROOT_DIR\n8n-workflows" -Command "docker-compose up"
    } else {
        Write-Warning "No se encontró docker-compose.yml para n8n"
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║             ✅ Todos los servicios iniciados!              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Info "URLs de acceso:"
Write-Host "   🌐 Frontend:    http://localhost:3000"
Write-Host "   ⚙️  Backend:     http://localhost:3001/api"
Write-Host "   📚 Swagger:     http://localhost:3001/api/docs"
Write-Host "   🤖 ML Service:  http://localhost:5000/health"
if ($hasDocker) {
    Write-Host "   🔄 n8n:         http://localhost:5678"
}

Write-Host ""
Write-Info "Credenciales de prueba:"
Write-Host "   Admin:    admin@agro.pe / admin123"
Write-Host "   Operador: operador@agro.pe / operador123"

Write-Host ""
Write-Warning "Presiona Ctrl+C en cada terminal para detener los servicios individualmente"
Write-Host ""

# Mantener el script activo
Write-Color "Presiona cualquier tecla para cerrar este panel de control..." "Yellow"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
