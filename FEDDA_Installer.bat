@echo off
setlocal EnableExtensions

set "INSTALLER_VERSION=15.0.0"
title FEDDA Hub v15 Installer

set "REPO_URL=https://github.com/Feddakalkun/Fedda_hub_v15"
set "REPO_BRANCH=main"
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "INSTALL_DIR=%ROOT%\app"
set "LOG_DIR=%ROOT%\logs"
set "LOG_FILE=%LOG_DIR%\fedda_v15_install.log"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>nul
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%" >nul 2>nul

echo. > "%LOG_FILE%"
echo [%date% %time%] FEDDA Hub v15 installer start >> "%LOG_FILE%"

echo.
echo  ============================================================
echo   FEDDA Hub v15 - One Click Installer
echo  ============================================================
echo.
echo   Focused local AI studio:
echo     - Image Studio
echo     - Video Studio
echo     - Unified Gallery
echo     - LoRA ^& Character
echo     - Ollama Models
echo.
echo   Install target:
echo     %INSTALL_DIR%
echo.
echo   Repository:
echo     %REPO_URL%
echo.
echo   Press any key to continue...
pause >nul

where git >nul 2>nul || goto :err_git
where node >nul 2>nul || goto :err_node
where npm >nul 2>nul || goto :err_npm

if exist "%INSTALL_DIR%\.git" goto :update_repo
goto :clone_repo

:update_repo
echo.
echo  [INFO] Existing v15 install detected. Updating...
pushd "%INSTALL_DIR%" || goto :err_pushd

for /f "delims=" %%r in ('git remote get-url origin 2^>nul') do set "ORIGIN_URL=%%r"
if /I not "%ORIGIN_URL%"=="%REPO_URL%" goto :err_remote

git diff --quiet --ignore-submodules HEAD
if not "%ERRORLEVEL%"=="0" goto :err_dirty

git fetch origin %REPO_BRANCH% >> "%LOG_FILE%" 2>&1 || goto :err_fetch
git checkout %REPO_BRANCH% >> "%LOG_FILE%" 2>&1 || goto :err_checkout
git pull --ff-only origin %REPO_BRANCH% >> "%LOG_FILE%" 2>&1 || goto :err_pull
popd
goto :run_install

:clone_repo
echo.
echo  [INFO] Cloning FEDDA Hub v15...
if exist "%INSTALL_DIR%" rmdir "%INSTALL_DIR%" /S /Q
git clone --branch %REPO_BRANCH% %REPO_URL% "%INSTALL_DIR%" >> "%LOG_FILE%" 2>&1 || goto :err_clone
goto :run_install

:run_install
if not exist "%INSTALL_DIR%\scripts\install.bat" goto :err_no_installbat

echo.
echo  [INFO] Running internal installer...
pushd "%INSTALL_DIR%" || goto :err_pushd
call scripts\install.bat LITE
set "INSTALL_EXIT=%ERRORLEVEL%"
popd

if not "%INSTALL_EXIT%"=="0" goto :err_install

echo.
echo  ============================================================
echo   FEDDA Hub v15 installation complete
echo  ============================================================
echo.
echo   Start app:
echo     %INSTALL_DIR%\run.bat
echo.
echo   Update later:
echo     %ROOT%\FEDDA_v15_Installer.bat
echo.
echo [%date% %time%] SUCCESS >> "%LOG_FILE%"
pause
exit /b 0

:err_git
echo [ERROR] Git was not found. Install Git from https://git-scm.com/downloads
pause
exit /b 1

:err_node
echo [ERROR] Node.js was not found. Install Node.js 18+ from https://nodejs.org/
pause
exit /b 1

:err_npm
echo [ERROR] npm was not found. Reinstall Node.js so npm is included.
pause
exit /b 1

:err_pushd
echo [ERROR] Could not enter install directory.
pause
exit /b 1

:err_remote
echo [ERROR] Existing app folder points to a different remote: %ORIGIN_URL%
popd
pause
exit /b 1

:err_dirty
echo [ERROR] Existing app folder has uncommitted changes. Commit or stash before updating.
popd
pause
exit /b 1

:err_fetch
echo [ERROR] Failed to fetch updates.
popd
pause
exit /b 1

:err_checkout
echo [ERROR] Failed to checkout branch.
popd
pause
exit /b 1

:err_pull
echo [ERROR] Git pull failed.
popd
pause
exit /b 1

:err_clone
echo [ERROR] Failed to clone repository. Check network/repo access.
pause
exit /b 1

:err_no_installbat
echo [ERROR] Internal installer missing: scripts\install.bat
pause
exit /b 1

:err_install
echo [ERROR] Internal installer failed with code %INSTALL_EXIT%.
echo Logs: %INSTALL_DIR%\logs\
pause
exit /b %INSTALL_EXIT%
