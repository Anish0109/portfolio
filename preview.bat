@echo off
rem Double-click to preview the portfolio on this PC. Close this window to stop the preview.
rem (Opening index.html directly does not work: browsers block videos inside 3D scenes on file:// pages.)
cd /d "%~dp0"
start "" http://localhost:8000
where python >nul 2>nul && (python preview.py 8000) || (py preview.py 8000)
pause
