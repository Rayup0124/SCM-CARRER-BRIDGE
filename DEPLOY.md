# Deployment Guide: Railway + Vercel + MongoDB Atlas

This guide walks you through deploying SCM Career Bridge to production for free using Railway (backend), Vercel (frontend), and MongoDB Atlas (database).

---

## Overview

```
Student/Public
     ↓
Vercel (Frontend)          → https://your-app.vercel.app
     ↓ (API calls)
Railway (Backend)          → https://your-backend.railway.app
     ↓ (database)
MongoDB Atlas (Database)   → Cloud MongoDB (free 512MB cluster)
     ↓ (file storage)
Railway Persistent Storage → resumes & company documents
```

---

## Step 1: Push Code to GitHub

```bash
cd d:\src\project\SCM-CARRER-BRIDGE

git init
git add .
git commit -m "Initial commit with file upload feature"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/scm-career-bridge.git
git push -u origin main
```

---

## Step 2: Create MongoDB Atlas Database

1. Go to [mongodb.com](https://www.mongodb.com/atlas) and create a free account
2. Create a **free M0 cluster** (choose Singapore or nearest region)
3. Click **Database Access** → Add New User:
   - Username: `scm_user`
   - Password: (generate a secure password)
   - Role: **Read and write to any database**
4. Click **Network Access** → Add IP: `0.0.0.0/0` (allow all IPs)
5. Click **Clusters** → **Connect** → **Connect your application**
6. Copy the connection string:

```
mongodb+srv://scm_user:YOUR_PASSWORD@cluster0.xxxxxx.mongodb.net/scm-career-bridge?retryWrites=true&w=majority
```

---

## Step 3: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `scm-career-bridge` repo
4. Railway will auto-detect the backend. Set the **Root Directory** to `backend`
5. Go to **Settings** → **Environment Variables** and add:

```
MONGODB_URI=mongodb+srv://scm_user:YOUR_PASSWORD@cluster0.xxxxxx.mongodb.net/scm-career-bridge?retryWrites=true&w=majority
JWT_SECRET=any_random_32_char_string_here
PORT=4000
FRONTEND_URL=https://your-app.vercel.app
```

6. Railway will auto-detect `npm install` and `npm start` from package.json
7. Wait for deployment to complete (~2-3 minutes)
8. Once deployed, Railway gives you a URL like:
   ```
   https://scm-career-bridge.up.railway.app
   ```
   Copy this URL (you'll need it for the frontend).

---

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **Add New** → **Project**
3. Import your `scm-career-bridge` repo
4. Set the **Root Directory** to `frontend`
5. Before deploying, click **Environment Variables** and add:

```
VITE_API_URL=https://scm-career-bridge.up.railway.app/api
```
(Replace with your actual Railway backend URL from Step 3)

6. Click **Deploy**
7. Wait for deployment (~1 minute)
8. Your app is now live at:
   ```
   https://your-app.vercel.app
   ```

---

## Step 5: Update CORS on Railway

After deploying the backend, go back to Railway:
1. Go to your backend project → **Settings** → **Environment Variables**
2. Update `FRONTEND_URL` with your Vercel URL (without trailing slash):
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. **Redeploy** the backend (click **Redeploy** on the deployment page)

---

## Step 6: Create Admin Account

After deployment, create the first admin account:

```bash
# Connect to Railway's shell
railway run npm run create-admin

# Or manually insert into MongoDB Atlas:
# Collection: users
# {
#   "name": "Admin",
#   "email": "admin@scm.edu.my",
#   "password": "$2a$10$..." (hashed password),
#   "studentId": "ADMIN001",
#   "programme": "Administration",
#   "role": "admin",
#   "resumeUrl": ""
# }
```

---

## File Storage on Railway

Railway provides **persistent disk storage** by default. The `backend/src/uploads/` folder will persist across deployments.

- Student resumes: `/uploads/resumes/filename.pdf`
- Company documents: `/uploads/company-docs/filename.pdf`

These are served statically at `https://your-backend.railway.app/uploads/...`

---

## Keep Railway Awake (Prevent Cold Starts)

Railway's free tier sleeps after 15 minutes of inactivity. The first request after sleep takes ~10 seconds to wake up.

To keep it awake 24/7:

1. Go to [uptimerobot.com](https://uptimerobot.com) (free)
2. Create an account
3. Add a new monitor:
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `SCM Backend`
   - URL: `https://your-backend.railway.app/api/health`
   - Monitoring Interval: **5 minutes**
4. Save

This pings your backend every 5 minutes so it never sleeps.

---

## Troubleshooting

### Frontend can't connect to backend
- Make sure `VITE_API_URL` in Vercel ends with `/api`
- Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Redeploy both after updating environment variables

### Files not uploading
- Railway has a 100MB disk limit on free tier per service
- Check Railway logs: Project → Deployment → Logs

### MongoDB connection failed
- Make sure the Atlas user has "Read and write to any database" permission
- Make sure Network Access allows `0.0.0.0/0`
- Check that the connection string in `MONGODB_URI` is correct

---

## Cost Summary

| Service | Usage | Cost |
|---------|-------|------|
| Railway | Backend hosting | Free (500 hours/month) |
| Vercel | Frontend hosting | Free (100GB bandwidth/month) |
| MongoDB Atlas | Database | Free (512MB) |
| UptimeRobot | Keep-alive ping | Free |

**Total: RM0 / month** for student projects with moderate traffic.
