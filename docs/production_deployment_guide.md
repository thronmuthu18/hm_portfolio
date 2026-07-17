# Production Deployment & Infrastructure Guide

This document provides a step-by-step production deployment manual for hosting the developer portfolio on **Netlify** (Frontend) and **Render** (Backend) linked to **MongoDB Atlas** (Database).

---

## 1. Preparing the Codebase (GitHub Repository Setup)

Create a clean GitHub repository for the project:
1. Sign in to your account at [github.com](https://github.com).
2. Create a **New Repository**:
   - Repository Name: `developer-portfolio`
   - Description: `Premium Full Stack Freelance Developer Portfolio Website`
   - Visibility: **Public** or **Private** (Public recommended to show clean coding practices to clients).
   - Click **Create Repository**.
3. Push your workspace directory (`d:\New folder (8)`) to the repository:
   ```bash
   git init
   git add .
   git commit -m "feat: complete production-ready full stack portfolio architecture"
   git branch -M main
   git remote add origin https://github.com/thronmuthu18/developer-portfolio.git
   git push -u origin main
   ```

---

## 2. Frontend Deployment (Netlify)

Netlify hosts static frontend assets efficiently using CDN routing:

1. Sign in to [netlify.com](https://www.netlify.com).
2. Click **Add New Site** -> **Import from Git**.
3. Select **GitHub** and authorize Netlify.
4. Select your `developer-portfolio` repository.
5. Configure **Site Build Settings**:
   - **Branch to deploy**: `main`
   - **Base directory**: *Leave blank (or set as root `/`)*
   - **Build command**: *Leave blank (no compile steps needed)*
   - **Publish directory**: `frontend` (Critical: Netlify will only deploy contents inside the `frontend` folder).
6. Click **Deploy Site**.
7. Once deployed, Netlify will generate a default subdomain (e.g. `sitetitle.netlify.app`). Copy this URL.

---

## 3. Backend Deployment (Render)

Render hosts Node.js server instances with automatic rebuild hooks:

1. Sign in to [render.com](https://render.com).
2. Click **New** -> **Web Service**.
3. Select **Build and deploy from a Git repository**.
4. Connect your `developer-portfolio` repository.
5. Configure **Service Settings**:
   - **Name**: `portfolio-backend`
   - **Runtime**: `Node`
   - **Root Directory**: `backend` (Critical: Render will only build contents inside the `backend` folder).
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js` or `npm start`
   - **Instance Type**: **Free** (or Starter/Standard based on query frequencies).
6. Configure **Environment Variables**:
   Click **Advanced** -> **Add Environment Variable**:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render binds this port automatically)
   - `MONGODB_URI` = `mongodb+srv://...` (Your MongoDB Atlas production connection string)
   - `CLIENT_URL` = `https://your-site-subdomain.netlify.app` (Your live Netlify URL to authorize CORS)
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `EMAIL_USER` = `sudalaimuthusudalai754@gmail.com`
   - `EMAIL_PASS` = `your-gmail-app-password`
   - `RECEIVER_EMAIL` = `sudalaimuthusudalai754@gmail.com`
7. Click **Create Web Service**.
8. Copy the generated Render URL (e.g. `https://portfolio-backend.onrender.com`).
9. **Update Frontend API Base URL**:
   - Open `frontend/js/main.js` locally.
   - Replace the `API_BASE_URL` fallback link with your live Render URL.
   - Commit and push changes to GitHub. Netlify will auto-deploy the updated code!

---

## 4. Custom Domain Connection & DNS Settings (Optional)

To connect a personal domain (e.g., `sudalaimuthu.dev`):

1. **Purchase Domain**: Purchase from Namecheap, GoDaddy, or Google Domains.
2. **Netlify Domain Configuration**:
   - Navigate to **Site settings** -> **Domain management** on Netlify.
   - Click **Add custom domain** and enter your domain name.
   - Netlify will suggest setting custom nameservers.
3. **Configure DNS Records (Nameservers vs A/CNAME)**:
   - If using Netlify DNS: Copy the 4 nameservers provided by Netlify (e.g., `dns1.p01.nsone.net`) and paste them in your registrar’s DNS custom nameservers settings.
   - If keeping your registrar's DNS: Add an **A Record** pointing `@` to Netlify's load balancer IP (`75.101.145.8`) and a **CNAME Record** pointing `www` to your Netlify app URL (`sitetitle.netlify.app`).
4. **Enable HTTPS / SSL**:
   - Once DNS propagates (1-24 hours), Netlify automatically provisions a free Let's Encrypt SSL certificate. Scroll to the bottom of Domain management and click **Verify DNS / Provision SSL**.

---

## 5. Backup & Recovery Operations (Disaster Recovery)

- **Source Control Rollback**: If a production build fails, navigate to the deployment page on Netlify or Render, select a previous successful commit build, and click **Rollback/Publish** to restore a working state instantly.
- **MongoDB Atlas Backups**: Atlas Free Tier includes continuous monitoring; however, production tiers support automated point-in-time recovery (PITR) snapshots. To manually back up your collections, run:
  ```bash
  mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/portfolio" --out="./backup-folder"
  ```
- **Secrets Management**: Keep a local offline copy of your production `.env` settings securely in a password manager (e.g., Bitwarden or 1Password). Never store credentials in plaintext on your machine.
