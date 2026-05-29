# AutonomousOps AI - Free Deployment Guide

## Architecture

```
Frontend (Next.js)  -->  Vercel (free)
Backend (NestJS)    -->  Render (free tier)
Database (MySQL)    -->  TiDB Serverless (free)
```

---

## Step 1: Create TiDB Serverless Database (Free)

1. Go to [tidbcloud.com](https://tidbcloud.com) and sign up (GitHub/Google login)
2. Click **"Create Cluster"** > Select **"Serverless"**
3. Choose region: **Singapore** (closest to Render's free region)
4. Name: `autonomousops`
5. Click **"Create"**
6. Once created, click **"Connect"** button
7. Copy the connection string - it looks like:
   ```
   mysql://<user>:<password>@<host>:4000/autonomousops?sslaccept=strict
   ```
8. **Save this** - you'll need it for Render

---

## Step 2: Deploy Backend to Render (Free)

1. Push your code to GitHub (if not already)

2. Go to [render.com](https://render.com) and sign up with GitHub

3. Click **"New"** > **"Web Service"**

4. Connect your GitHub repo

5. Configure:
   - **Name**: `autonomousops-backend`
   - **Region**: Singapore
   - **Runtime**: Docker
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Docker Context**: `./backend`
   - **Plan**: Free

6. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your TiDB connection string from Step 1 |
   | `JWT_SECRET` | Generate a random 32+ char string |
   | `JWT_EXPIRES_IN` | `7d` |
   | `FRONTEND_URL` | `https://your-app.vercel.app` (update after Step 3) |
   | `PORT` | `3001` |
   | `SMTP_EMAIL` | `lotasib852@gmail.com` |
   | `SMTP_APP_PASSWORD` | `gwfckgvqolrjosjc` |
   | `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret |
   | `GOOGLE_CALLBACK_URL` | `https://your-backend.onrender.com/api/auth/google/callback` |

7. Click **"Create Web Service"**
8. Wait for build to complete (~5-10 min)
9. Your backend URL: `https://autonomousops-backend.onrender.com`
10. Test: Visit `https://autonomousops-backend.onrender.com/api/docs`

---

## Step 3: Deploy Frontend to Vercel (Free)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub

2. Click **"Add New"** > **"Project"**

3. Import your GitHub repo

4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-detected)

5. Add Environment Variable:
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://autonomousops-backend.onrender.com/api` |

6. Click **"Deploy"**
7. Wait for build (~2-3 min)
8. Your frontend URL: `https://your-app.vercel.app`

---

## Step 4: Update Backend CORS

After Vercel gives you the URL:

1. Go to Render Dashboard > your backend service
2. Update `FRONTEND_URL` env var to your Vercel URL
3. Render will auto-redeploy

---

## Step 5: Run Database Migrations

Render automatically runs `prisma migrate deploy` on startup (configured in Dockerfile).

If you need to run manually:

```bash
# From your local machine, with production DATABASE_URL set
cd backend
npx prisma migrate deploy
```

---

## Free Tier Limits

| Service             | Limit                                              |
| ------------------- | -------------------------------------------------- |
| **Vercel**          | 100GB bandwidth/month, unlimited deploys           |
| **Render**          | 750 hours/month, auto-sleep after 15min inactivity |
| **TiDB Serverless** | 5GB storage, 50M Request Units/month               |

## Important Notes

- **Render cold start**: First request after 15min inactivity takes ~30s
- **TiDB SSL**: Connection string must include `?sslaccept=strict`
- **Google OAuth**: Update callback URL in Google Cloud Console to your Render backend URL
- **Environment variables**: Never commit `.env` files - use platform dashboards

---

## Quick Commands

```bash
# Test backend locally with production DB
cd backend
DATABASE_URL="mysql://username:password@gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com:4000/sys?sslaccept=strict" npm run start:dev

# Build frontend locally
npm run build

# Check Prisma migrations
cd backend
npx prisma migrate status
```
