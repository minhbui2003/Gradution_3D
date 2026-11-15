@echo off
cd /d "%~dp0"
python tools\check_production.py --scope all
if errorlevel 1 echo [ERROR] Co loi ky thuat. Xem bao cao o tren.
python tools\sync_inputs.py --dry-run
pause
