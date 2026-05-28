# Deployment Guide

## 1) Push this project to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M master
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin master
```

## 2) Deploy the frontend (Next.js) on Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click New Project -> Import this repository.
3. Set Root Directory to `.`.
4. Build command: `npm run build`
5. Output directory: `.next`
6. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_URL/api`
7. Deploy.

## 3) Deploy the backend (NestJS) on Render

1. Create a new Web Service on Render.
2. Connect the same GitHub repo.
3. Set Root Directory to `backend`.
4. Build Command:
   ```bash
   npm install
   npm run prisma:generate
   npm run build
   ```
5. Start Command:
   ```bash
   npm run prisma:migrate:deploy && npm run start:prod
   ```
6. Add environment variables from `backend/.env.example`.
7. Set `FRONTEND_URL` to your Vercel frontend URL.
8. Set `GOOGLE_CALLBACK_URL` to `https://YOUR_RENDER_APP.onrender.com/api/auth/google/callback`.

## 4) Database

This backend uses Prisma + MySQL.

Recommended options:
- Railway MySQL
- PlanetScale
- Aiven MySQL

After creating the database, set:
- `DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DB_NAME"`

Then run once:

```bash
cd backend
npx prisma migrate deploy
```

## 5) Final connection

In Vercel, set:
- `NEXT_PUBLIC_API_URL=https://YOUR_RENDER_APP.onrender.com/api`

Your live app will be:
- Frontend: `https://YOUR-VERCEL-APP.vercel.app`
- Backend API: `https://YOUR_RENDER_APP.onrender.com/api`
