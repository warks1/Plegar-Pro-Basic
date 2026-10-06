$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
npm install
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias de Plegar Pro.' }
Start-Process powershell -ArgumentList '-NoExit','-Command','npm run dev' -WorkingDirectory $PSScriptRoot
Start-Sleep -Seconds 3
Start-Process 'http://127.0.0.1:4186/'
