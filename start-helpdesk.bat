@echo off
cd /d "%~dp0"
echo.
echo PMG Helpdesk - serveur local
echo Ouvrez : http://127.0.0.1:8888/ui_kits/helpdesk/index.html
echo Arret : Ctrl+C
echo.
python -m http.server 8888 --bind 127.0.0.1
if errorlevel 1 py -3 -m http.server 8888 --bind 127.0.0.1
pause
