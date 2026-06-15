# Demarre PostgreSQL + Redis + API FastAPI (Docker Compose)
$Root = $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host "PMG Helpdesk - Backend (Docker)"
Write-Host "API      : http://127.0.0.1:8001"
Write-Host "Swagger  : http://127.0.0.1:8001/docs"
Write-Host "Health   : http://127.0.0.1:8001/api/health"
Write-Host "Smoke    : .\scripts\smoke-api.ps1"
Write-Host "Postgres : localhost:5433 (pmg / pmg_dev / pmg_helpdesk)"
Write-Host ""
Write-Host "Arret : Ctrl+C puis docker compose down"
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "Docker introuvable. Installez Docker Desktop : https://www.docker.com/products/docker-desktop/"
  Read-Host "Appuyez sur Entree pour fermer"
  exit 1
}

docker compose up --build