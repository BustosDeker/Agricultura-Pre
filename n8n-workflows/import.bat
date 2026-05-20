@echo off
chcp 65001 >nul
title 🔄 Importar Workflows n8n
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     🔄 Importador de Workflows n8n - AgroSmart           ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0import-workflows.ps1"

echo.
echo Presiona cualquier tecla para salir...
pause >nul
