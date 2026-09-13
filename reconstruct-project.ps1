$ErrorActionPreference = 'Stop'
Write-Host 'ReachInbox Scheduler - Windows setup' -ForegroundColor Green
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is not installed.' }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop is not installed or not on PATH.' }
docker compose up -d
Set-Location backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
npx prisma generate
npx prisma migrate dev --name init
Set-Location ..\frontend
if (-not (Test-Path .env.local)) { Copy-Item .env.local.example .env.local }
npm install
Set-Location ..
Write-Host 'Setup complete. Start backend: cd backend; npm run dev' -ForegroundColor Green
Write-Host 'Start frontend in another terminal: cd frontend; npm run dev' -ForegroundColor Green
