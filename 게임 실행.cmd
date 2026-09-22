@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "GAME_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "GAME_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "node_modules\vite\bin\vite.js" (
  echo Dependencies are missing. Run pnpm install or npm install first.
  pause
  exit /b 1
)
"%GAME_NODE%" scripts\start.mjs
if errorlevel 1 pause
