#!/bin/bash
# Quantyx Startup Script (Linux/Mac)
# Run: chmod +x start.sh && ./start.sh

echo "🚀 Starting Quantyx v5..."

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found!"
    echo "   Copy backend/.env.example to backend/.env and configure it"
    exit 1
fi

# Start backend
echo "📦 Starting Express backend (port 3001)..."
cd backend && npm run dev &
BACKEND_PID=$!

# Start ML engine
echo "🤖 Starting ML engine (port 5001)..."
cd backend/ml-engine && python api.py &
ML_PID=$!

# Wait a bit
sleep 2

# Start frontend
echo "🎨 Starting Vite frontend (port 5173)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ All services started!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   ML API:   http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $ML_PID $FRONTEND_PID; exit" INT
wait
