@echo off
echo Starting Bid Master Development Servers...

echo Starting Backend Server...
start "Backend" cmd /k "cd server && npm run dev"

timeout /t 3

echo Starting Frontend Server...
start "Frontend" cmd /k "cd client && npm run dev"

echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause