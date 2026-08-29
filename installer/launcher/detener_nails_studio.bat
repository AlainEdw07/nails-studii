@echo off
REM detener_nails_studio.bat
REM Detiene los procesos iniciados por iniciar_nails_studio.bat leyendo los archivos PID.

SET PIDS_DIR=%~dp0\pids
SET PIDS_DIR=%PIDS_DIR:~0,-1%

if not exist "%PIDS_DIR%\backend.pid" goto :no_backend
for /f "usebackq" %%p in ("%PIDS_DIR%\backend.pid") do set BACKEND_PID=%%p
if defined BACKEND_PID (
    echo Deteniendo backend PID %BACKEND_PID%...
    taskkill /PID %BACKEND_PID% /F >nul 2>&1
    del "%PIDS_DIR%\backend.pid" >nul 2>&1
)
:no_backend

if not exist "%PIDS_DIR%\frontend.pid" goto :no_frontend
for /f "usebackq" %%p in ("%PIDS_DIR%\frontend.pid") do set FRONTEND_PID=%%p
if defined FRONTEND_PID (
    if "%FRONTEND_PID%"=="STATIC_SERVED_BY_APACHE" (
        echo Frontend servido por Apache/AMMPS — no hay proceso a detener.
        del "%PIDS_DIR%\frontend.pid" >nul 2>&1
    ) else (
        echo Deteniendo frontend PID %FRONTEND_PID%...
        taskkill /PID %FRONTEND_PID% /F >nul 2>&1
        del "%PIDS_DIR%\frontend.pid" >nul 2>&1
    )
)
:no_frontend

if not exist "%PIDS_DIR%\chatbot.pid" goto :no_chatbot
for /f "usebackq" %%p in ("%PIDS_DIR%\chatbot.pid") do set CHATBOT_PID=%%p
if defined CHATBOT_PID (
    echo Deteniendo chatbot PID %CHATBOT_PID%...
    taskkill /PID %CHATBOT_PID% /F >nul 2>&1
    del "%PIDS_DIR%\chatbot.pid" >nul 2>&1
)
:no_chatbot

echo Operaciones de detención completadas.
pause
