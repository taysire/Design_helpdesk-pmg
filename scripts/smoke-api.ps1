# Smoke test - API PMG Helpdesk (Phase 0)
$Base = if ($env:PMG_API_BASE) { $env:PMG_API_BASE } else { "http://127.0.0.1:8001" }

Write-Host ""
Write-Host "PMG Helpdesk - smoke test API"
Write-Host "Base URL : $Base"
Write-Host ""

function Test-Endpoint($Method, $Path, $Body) {
  $uri = "$Base$Path"
  Write-Host "-> $Method $Path"
  try {
    if ($Body) {
      $json = $Body | ConvertTo-Json -Depth 6 -Compress
      $res = Invoke-RestMethod -Uri $uri -Method $Method -Body $json -ContentType "application/json"
    } else {
      $res = Invoke-RestMethod -Uri $uri -Method $Method
    }
    return $res
  } catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
  }
}

$health = Test-Endpoint GET "/api/health"
if ($health.status -ne "ok" -or $health.database -ne "connected") {
  Write-Host "Health check failed" -ForegroundColor Red
  exit 1
}
Write-Host "   OK - database connected" -ForegroundColor Green

$created = Test-Endpoint POST "/api/tickets" @{
  ticket_type = "incident"
  title       = "Smoke test - printer offline"
  category    = "hardware"
  priority    = "P3"
  status      = "new"
  reporter_id = "me"
  body        = "Ticket created by scripts/smoke-api.ps1"
  form_answers = @{ problem_area = "Imprimante"; department = "Administration" }
}
Write-Host "   OK - ticket created: $($created.id)" -ForegroundColor Green

$list = Test-Endpoint GET "/api/tickets"
$found = $list | Where-Object { $_.id -eq $created.id }
if (-not $found) {
  Write-Host "Ticket $($created.id) not found in GET /api/tickets" -ForegroundColor Red
  exit 1
}
Write-Host "   OK - ticket listed ($($list.Count) total)" -ForegroundColor Green

Write-Host ""
Write-Host "Smoke test passed." -ForegroundColor Green
Write-Host ""
