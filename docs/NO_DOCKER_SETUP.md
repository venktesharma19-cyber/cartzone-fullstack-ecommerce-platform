
## Install project dependencies automatically

After installing Node.js LTS, run this from the main `cartzone` folder:

```powershell
.\install-dependencies.bat
```

Alternative PowerShell command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-dependencies.ps1
```

Alternative npm command:

```powershell
npm run install:all
```

These commands install dependencies for both folders:

- `backend/package.json`
- `frontend/package.json`

# Run CartZone without Docker on Windows

Use this setup when Docker and winget are not available.

## What you need

1. Node.js LTS installed manually from the official Node.js website.
2. PostgreSQL installed manually from the official PostgreSQL Windows installer.
3. Redis is optional for local demo because this project supports `REDIS_MODE=memory`.

For the most professional LinkedIn/GitHub story, keep Redis in the architecture. For your local first run, memory mode is fine.

## 1. Install Node.js

Download the Windows LTS installer from Node.js and install it using the default settings.

After installation, close PowerShell and open it again.

Check:

```powershell
node -v
npm -v
```

## 2. Install PostgreSQL

Download the Windows PostgreSQL installer and install it.

During installation, remember the password you set for the default `postgres` user.

Keep the default port:

```txt
5432
```

Open **SQL Shell (psql)** from the Start Menu and create the database:

```sql
CREATE DATABASE cartzone;
\q
```

If SQL Shell asks for values, usually use:

```txt
Server: localhost
Database: postgres
Port: 5432
Username: postgres
Password: the password you created
```

## 3. Configure backend env

From the project root:

```powershell
cd backend
copy .env.no-docker.example .env
notepad .env
```

Update this line with your PostgreSQL password:

```env
DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/cartzone
```

Keep this for local demo without Redis:

```env
REDIS_MODE=memory
```

## 4. Run backend

```powershell
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Backend should run here:

```txt
http://localhost:4000/health
```

## 5. Run frontend

Open a second PowerShell window:

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend should run here:

```txt
http://localhost:5173
```

## Demo accounts

```txt
buyer@cartzone.dev   / Password123!
seller@cartzone.dev  / Password123!
admin@cartzone.dev   / Password123!
```

## Optional: real Redis later

When you install Redis later, change backend `.env`:

```env
REDIS_MODE=redis
REDIS_URL=redis://localhost:6379
```

Then restart the backend.
