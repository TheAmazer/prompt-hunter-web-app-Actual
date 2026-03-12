@echo off
echo ==========================================
echo    PromptHunter WebApp - Dev Start Script
echo ==========================================

echo [1/3] Checking dependencies (npm install)...
call npm install 2>> error.log
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed! See error.log for details.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/3] Starting Frontend (Vite)...
:: Runs 'npm run dev'. Errors are captured in error.log. If it crashes, it outputs a message and pauses to keep window open.
start "Vite Frontend" cmd /k "npm run dev 2>> error.log || (echo [CRASH] Frontend failed. Check error.log & pause)"

echo [3/3] Starting Backend (Node.js)...
:: Replace 'node server.js' below with your actual backend start command if different (e.g., 'npm start' in your server folder).
start "Node Backend" cmd /k "node server.js 2>> error.log || (echo [CRASH] Backend failed. Check error.log & pause)"

echo Done! Both servers are starting up in separate windows. Allow them a moment to initialize.
