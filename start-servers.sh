#!/bin/bash

echo "🚀 Spouštím dotační kalkulátor..."

# Funkce pro ukončení všech procesů při ukončení skriptu
cleanup() {
    echo "🛑 Ukončuji servery..."
    pkill -f "python3 -m http.server" || true
    pkill -f "node server.js" || true
    exit 0
}

# Nastavení trap pro ukončení skriptu
trap cleanup SIGINT SIGTERM

# Ukončení existujících procesů na portech
echo "🧹 Čistím existující procesy..."
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 > /dev/null 2>&1 || true
lsof -i :8888 | grep LISTEN | awk '{print $2}' | xargs kill -9 > /dev/null 2>&1 || true
pkill -f "python3 -m http.server" > /dev/null 2>&1 || true
pkill -f "node server.js" > /dev/null 2>&1 || true

sleep 2

echo "🌐 Spouštím frontend server (port 8888)..."
python3 -m http.server 8888 &
FRONTEND_PID=$!

sleep 2

echo "⚙️ Spouštím backend server (port 3000)..."
cd backend
npm start &
BACKEND_PID=$!

cd ..

echo "✅ Servery jsou spuštěny:"
echo "   📱 Frontend: http://localhost:8888"
echo "   🔧 Backend: http://localhost:3000"
echo ""
echo "📝 Pro ukončení stiskněte Ctrl+C"

# Čekání na signál ukončení
wait 