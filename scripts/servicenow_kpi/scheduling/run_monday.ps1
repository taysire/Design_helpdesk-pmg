# Pipeline hebdomadaire — chaque lundi 9h
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$KpiDir = Split-Path -Parent $ScriptDir
Set-Location $KpiDir

$Python = $env:KPI_PYTHON
if (-not $Python) {
    $Python = (Get-Command python -ErrorAction SilentlyContinue).Source
}
if (-not $Python) {
    Write-Error "Python introuvable. Definissez KPI_PYTHON ou ajoutez python au PATH."
}

Write-Host "=== KPI ServiceNow — $(Get-Date -Format 'yyyy-MM-dd HH:mm') ==="
& $Python run_automated.py
exit $LASTEXITCODE
