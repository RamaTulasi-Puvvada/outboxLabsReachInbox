$ErrorActionPreference='Stop'
docker compose up -d
Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location backend; npm run dev'
Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location frontend; npm run dev'
Start-Sleep -Seconds 3
Start-Process 'http://localhost:3000'
