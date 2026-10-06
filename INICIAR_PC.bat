@echo off
cd /d "%~dp0"
echo Iniciando Plegar Pro...
call npm install
if errorlevel 1 (echo Error instalando dependencias.&pause&exit /b 1)
start "Plegar Pro" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "" http://127.0.0.1:4186/
