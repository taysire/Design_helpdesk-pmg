@echo off
cd /d "%~dp0.."
python run_automated.py
exit /b %ERRORLEVEL%
