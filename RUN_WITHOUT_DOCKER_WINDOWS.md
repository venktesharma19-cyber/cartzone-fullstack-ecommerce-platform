# CartZone Windows Quick Start without Docker

Use this when Docker and winget are not available.

## Required manual installs

- Node.js LTS
- PostgreSQL for Windows

Redis is optional for local demo because backend `.env` can use:

```env
REDIS_MODE=memory
```


## Install project dependencies automatically

From the main `cartzone` folder, run:

```powershell
.\install-dependencies.bat
```

Or run the PowerShell version:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-dependencies.ps1
```

This installs both backend and frontend npm dependencies and creates `.env` files from the examples.

You can also use the root npm helper after Node is available:

```powershell
npm run install:all
```

## Create database

Open SQL Shell / psql:

```sql
CREATE DATABASE cartzone;
\q
```

## Backend terminal

```powershell
cd backend
copy .env.no-docker.example .env
notepad .env
```

Set your real PostgreSQL password:

```env
DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/cartzone
REDIS_MODE=memory
```

Then run:

```powershell
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Frontend terminal

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open:

```txt
http://localhost:5173
```
