#!/bin/bash
# Start both backend and frontend

echo "Starting Expense Tracker..."

# Start backend
cd "$(dirname "$0")/backend"
npm install --silent
node src/index.js &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Start frontend
cd "$(dirname "$0")/frontend"
npm install --silent
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "=========================================="
echo "  Expense Tracker is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5000"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait and clean up
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
