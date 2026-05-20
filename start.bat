@echo off
chcp 65001 >nul
title 🌱 AgroSmart - Iniciar Sistema
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     🌱 AgroSmart - Sistema de Agricultura de Precisión   ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Verificar PowerShell
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PowerShell no está disponible
    pause
    exit /b 1
)

REM Menú
echo Selecciona modo de ejecución:
echo.
echo [1] 🚀 Simple - Una terminal con logs de todos los servicios
if exist "n8n-workflows\docker-compose.yml" (
    echo [2] 🚀 Simple + n8n - Incluye automatización con n8n
)
echo [3] 🪟 Múltiples terminales - Cada servicio en su propia ventana
echo [4] ❌ Detener todos los servicios
if exist "n8n-workflows\docker-compose.yml" (
    echo [5] 🛑 Detener n8n (Docker)
)
echo.

set /p choice="Selecciona una opción (1-5): "

if "%choice%"=="1" (
    echo.
    echo [*] Iniciando en modo simple...
    powershell -ExecutionPolicy Bypass -File "%~dp0start-simple.ps1"
    goto :end
)

if "%choice%"=="2" (
    echo.
    echo [*] Iniciando en modo simple con n8n...
    powershell -ExecutionPolicy Bypass -File "%~dp0start-simple.ps1" -IncludeN8n
    goto :end
)

if "%choice%"=="3" (
    echo.
    echo [*] Iniciando en múltiples terminales...
    powershell -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"
    goto :end
)

if "%choice%"=="4" (
    echo.
    echo [*] Deteniendo servicios...
    taskkill /F /IM node.exe 2>nul
    taskkill /F /IM python.exe 2>nul
    taskkill /F /IM python3.exe 2>nul
    echo [✓] Servicios Node.js y Python detenidos
    goto :end
)

if "%choice%"=="5" (
    echo.
    echo [*] Deteniendo n8n...
    cd /d "%~dp0n8n-workflows"
    docker-compose down
    goto :end
)

echo [!] Opción no válida
goto :end

:end
echo.
echo Presiona cualquier tecla para salir...
pause >nul
