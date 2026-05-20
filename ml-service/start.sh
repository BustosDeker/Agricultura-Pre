#!/bin/bash
echo "🤖 Iniciando ML Service..."

# Instalar dependencias si no están instaladas
if ! python -c "import flask" 2>/dev/null; then
    echo "📦 Instalando dependencias Python..."
    pip install -r requirements.txt
fi

# Iniciar el servicio
python app.py
