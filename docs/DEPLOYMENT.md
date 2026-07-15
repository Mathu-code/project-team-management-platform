# Deployment Guide

This project supports two deployment targets:
- **Frontend:** GitHub Pages (static hosting)
- **Backend:** Railway (container hosting with PostgreSQL)

---

## Prerequisites

- A GitHub account with this repository pushed
- A Railway account (https://railway.app)
- Your backend domain from Railway (e.g. `https://your-app.up.railway.app`)

---

## 1. Deploy Backend to Railway

### Step 1: Create a new project on Railway
1. Go to https://railway.app/new
2. Select **Deploy from GitHub repo**
3. Choose this repository
4. Railway will auto-detect the `Dockerfile` in `backend/`

### Step 2: Add PostgreSQL
1. In your Railway project, click **New** → **Database** → **PostgreSQL**
2. Railway will create a PostgreSQL instance and inject `DATABASE_URL` into the backend service automatically

### Step 3: Configure environment variables
In the Railway backend service settings → **Variables**, add:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | *Auto-provided by Railway PostgreSQL plugin* |
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `API_PREFIX` | `/api` |
| `JWT_SECRET` | *Your strong secret (e.g. generate with `openssl rand -hex 32`)* |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | *Your GitHub Pages URL (e.g. `https://yourname.github.io`)* |

> **Note:** If your GitHub Pages URL is not known yet, you can add it later and redeploy.

### Step 4: Add persistent volume for uploads (optional but recommended)
1. In the Railway backend service, go to **Volumes**
2. Create a volume named `backend_uploads`
3. Mount it to `/app/uploads`

This ensures uploaded PDFs/images survive redeploys.

### Step 5: Deploy
Railway will automatically build and deploy on every push to `main`. The backend will:
1. Run `npx prisma migrate deploy` on startup
2. Start the Express server on the Railway-provided port

### Step 6: Note your backend URL
After deployment, Railway provides a public URL like:
```
https://your-app-name.up.railway.app
```

Save this URL — you will need it for the frontend configuration.

---

## 2. Deploy Frontend to GitHub Pages

### Step 1: Enable GitHub Pages
1. Go to your GitHub repository → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, select **GitHub Actions**

### Step 2: Add repository variable
1. Go to **Settings** → **Secrets and variables** → **Actions** → **Variables**
2. Click **New repository variable**
3. Name: `NEXT_PUBLIC_API_BASE`
4. Value: *Your Railway backend URL + `/api` (e.g. `https://your-app.up.railway.app/api`)*

### Step 3: Push to main
The workflow `.github/workflows/deploy-frontend.yml` will automatically:
1. Build the Next.js app as static HTML
2. Deploy to GitHub Pages

### Step 4: Configure base path (if using a project page)
If your GitHub Pages URL is `https://username.github.io/repo-name/` (project page), add `basePath` to `frontend/next.config.mjs`:

```js
const nextConfig = {
  // ...
  basePath: '/repo-name',
};
```

If your GitHub Pages URL is `https://username.github.io/` (user/organization page), no `basePath` is needed.

---

## 3. Verify Deployment

| Service | URL |
| --- | --- |
| Frontend | `https://<username>.github.io/<repo>/` (or your custom domain) |
| Backend API | `https://<your-app>.up.railway.app/api` |
| Health check | `https://<your-app>.up.railway.app/api/health` |

### Test login
Use the seeded demo accounts:
- **Admin:** `admin@cyphlab.com` / `Password123!`
- **PM:** `pm@cyphlab.com` / `Password123!`
- **Member:** `alice@cyphlab.com` / `Password123!`

---

## 4. Updating CORS after deployment

If your frontend URL changes, update the `CORS_ORIGIN` variable in Railway:
1. Railway dashboard → Backend service → **Variables**
2. Update `CORS_ORIGIN` to match your new frontend URL
3. Redeploy the backend

---

## 5. Local development (unchanged)

```bash
# Terminal 1: Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev

# Terminal 2: Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
