#!/bin/bash

echo "🔄 Restartování dotačního kalkulátoru..."

# Ukončit všechny existující procesy
echo "🛑 Ukončuji staré procesy..."
pkill -f "python3 -m http.server" > /dev/null 2>&1 || true
pkill -f "node server.js" > /dev/null 2>&1 || true
pkill -f "npm start" > /dev/null 2>&1 || true

# Vyčistit porty
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 > /dev/null 2>&1 || true
lsof -i :8888 | grep LISTEN | awk '{print $2}' | xargs kill -9 > /dev/null 2>&1 || true

sleep 2

echo "🌐 Spouštím backend server (port 3000)..."
cd backend && npm start > ../backend.log 2>&1 &
BACKEND_PID=$!

sleep 3

echo "🖥️  Spouštím frontend server (port 8888)..."
cd ..
python3 -m http.server 8888 > frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 2

# Test konektivity
echo "🔍 Testujem konektivitu..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend server běží na http://localhost:3000"
else
    echo "❌ Backend server nefunguje"
    exit 1
fi

if curl -s http://localhost:8888 > /dev/null; then
    echo "✅ Frontend server běží na http://localhost:8888"
else
    echo "❌ Frontend server nefunguje"
    exit 1
fi

echo ""
echo "🚀 Dotační kalkulátor je připraven!"
echo "📖 Frontend: http://localhost:8888"
echo "⚙️  Backend API: http://localhost:3000"
echo ""
echo "Pro ukončení stiskněte Ctrl+C"

# Čekání na ukončení
trap 'echo ""; echo "🛑 Ukončuji servery..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

wait 