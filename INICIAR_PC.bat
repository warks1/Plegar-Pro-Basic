@echo off
setlocal
cd /d "%~dp0"
echo Iniciando Plegar Pro desde la carpeta site...
if not exist "site\index.html" (
  echo ERROR: No se encuentra site\index.html.
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta instalado o no esta en PATH.
  pause
  exit /b 1
)
start "Plegar Pro - servidor" cmd /k "cd /d ""%~dp0"" && npm run serve"
set "READY="
for /L %%i in (1,1,30) do (
  powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://127.0.0.1:4186/; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 (
    set "READY=1"
    goto :open
  )
  timeout /t 1 /nobreak >nul
)
echo ERROR: El servidor no respondio en 30 segundos.
echo Revisa la ventana "Plegar Pro - servidor" para ver el error.
pause
exit /b 1
:open
start "" http://127.0.0.1:4186/
endlocal
