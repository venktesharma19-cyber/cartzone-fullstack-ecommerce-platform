@echo off
setlocal

echo.
echo ==============================================
echo CartZone dependency installer for Windows
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not available in PATH.
  echo Install Node.js LTS manually from https://nodejs.org, then reopen Command Prompt or PowerShell.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm is not installed or not available in PATH.
  echo npm comes with Node.js LTS. Reinstall Node.js if npm is missing.
  exit /b 1
)

echo Node version:
node -v
echo npm version:
npm -v

echo.
echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 exit /b 1
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 exit /b 1
cd ..

echo.
echo Preparing environment files...
if not exist backend\.env (
  if exist backend\.env.no-docker.example (
    copy backend\.env.no-docker.example backend\.env
    echo Created backend\.env
  ) else if exist backend\.env.example (
    copy backend\.env.example backend\.env
    echo Created backend\.env
  )
) else (
  echo backend\.env already exists. Skipped.
)

if not exist frontend\.env (
  if exist frontend\.env.example (
    copy frontend\.env.example frontend\.env
    echo Created frontend\.env
  )
) else (
  echo frontend\.env already exists. Skipped.
)

echo.
echo Done.
echo.
echo Next steps:
echo 1. Create PostgreSQL database: cartzone
echo 2. Edit backend\.env and set DATABASE_URL with your PostgreSQL password
echo 3. Keep REDIS_MODE=memory if you are not using Redis
echo 4. Run: npm run db:migrate
echo 5. Run: npm run db:seed
echo 6. Start backend: npm run dev:backend
echo 7. Start frontend in a second terminal: npm run dev:frontend
echo.

endlocal
