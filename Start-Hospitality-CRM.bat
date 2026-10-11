@echo off
TITLE GrandStay Hospitality CRM — Local Server Launcher
COLOR 0A

echo =====================================================================
echo           GRANDSTAY HOSPITALITY MANAGEMENT SAAS CRM                  
echo =====================================================================
echo.
echo [1/3] Checking environment & MySQL connection...
echo Current directory: %CD%

REM Check if backend venv exists
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Backend virtual environment not found at backend\venv!
    echo Please run: cd backend ^&^& python -m venv venv ^&^& venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo [ERROR] Frontend node_modules not found at frontend\node_modules!
    echo Please run: cd frontend ^&^& npm install
    pause
    exit /b 1
)

echo [2/3] Starting Backend API Server (FastAPI on http://127.0.0.1:8000)...
start "GrandStay Backend (FastAPI)" cmd /k "cd /d %CD%\backend && venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Web Server (Vite on http://localhost:5173)...
start "GrandStay Frontend (Vite)" cmd /k "cd /d %CD%\frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo =====================================================================
echo   GRANDSTAY CRM LOCAL SERVERS ARE RUNNING!
echo   - Web Application: http://localhost:5173
echo   - Backend Swagger API Docs: http://127.0.0.1:8000/docs
echo.
echo   DEMO CREDENTIALS:
echo   - SaaS Super Admin: superadmin@grandstay.com / Admin@12345
echo   - Serene Valley Resort Admin: admin@serenevalley.com / Admin@12345
echo   - Front Desk Receptionist: vikram@serenevalley.com / Admin@12345
echo   - Restaurant Cashier: ananya@serenevalley.com / Admin@12345
echo =====================================================================
echo.
echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo Press any key to close this launcher window (servers will remain active in their terminals).
pause >nul
