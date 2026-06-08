# Demarre le serveur local PMG Helpdesk (IPv4 explicite pour Windows)
$Root = $PSScriptRoot
Set-Location $Root

$Port = 8888
$Url = "http://127.0.0.1:$Port/ui_kits/helpdesk/index.html"

Write-Host ""
Write-Host "PMG Helpdesk - serveur local"
Write-Host "Ouvrez : $Url"
Write-Host "Arret : Ctrl+C"
Write-Host ""

if (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server $Port --bind 127.0.0.1
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
  py -3 -m http.server $Port --bind 127.0.0.1
} else {
  Write-Host "Python introuvable. Installez Python depuis https://www.python.org/downloads/"
  Read-Host "Appuyez sur Entree pour fermer"
  exit 1
}
