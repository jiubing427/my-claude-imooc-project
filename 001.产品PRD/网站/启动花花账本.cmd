@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 后再打开。
  pause
  exit /b 1
)
echo 请在浏览器打开 http://127.0.0.1:4173
echo 使用期间请保持本窗口打开，按 Ctrl+C 停止。
node server.mjs
pause
