$ErrorActionPreference='Stop'
Write-Host 'Starting Docker services...' -ForegroundColor Cyan
docker compose up -d
Write-Host 'Installing backend dependencies...' -ForegroundColor Cyan
Push-Location backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
npx prisma generate
npx prisma migrate dev --name init
Pop-Location
Write-Host 'Installing frontend dependencies...' -ForegroundColor Cyan
Push-Location frontend
if (!(Test-Path .env.local)) { Copy-Item .env.local.example .env.local }
npm install
Pop-Location
Write-Host 'Setup complete.' -ForegroundColor Green
