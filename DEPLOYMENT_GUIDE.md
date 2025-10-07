# 🚀 Poker Game - Live Hosting Deployment Guide

## Overview
This guide covers deploying your poker game to live hosting platforms. You have several options depending on your needs and budget.

---

## 🎯 Quick Deployment Options

### **Option 1: Vercel (Recommended - Easiest & Free)**
✅ Free tier available
✅ Automatic HTTPS
✅ Global CDN
✅ Zero config deployment

### **Option 2: Netlify**
✅ Free tier available
✅ Automatic HTTPS
✅ Easy CI/CD

### **Option 3: Railway**
✅ Full-stack support (frontend + backend)
✅ $5/month credit free
✅ Easy database integration

### **Option 4: AWS / DigitalOcean**
✅ Full control
✅ Scalable
⚠️ More complex setup
💰 Paid hosting

---

## 🚀 OPTION 1: Deploy to Vercel (FASTEST)

### Prerequisites
- GitHub account
- Vercel account (free at vercel.com)

### Step 1: Prepare Your Project

Run these commands in the `web` directory:

```powershell
cd web
npm run build
```

### Step 2: Install Vercel CLI

```powershell
npm install -g vercel
```

### Step 3: Deploy

```powershell
cd web
vercel
```

Follow the prompts:
- **Set up and deploy?** `Y`
- **Which scope?** (Select your account)
- **Link to existing project?** `N`
- **What's your project's name?** `shido-poker`
- **In which directory is your code located?** `./`
- **Want to override the settings?** `N`

### Step 4: Production Deployment

```powershell
vercel --prod
```

**Your game will be live at:** `https://shido-poker.vercel.app` (or similar)

### Configuration for Vercel

I'll create a `vercel.json` config file for you.

---

## 🚀 OPTION 2: Deploy to Netlify

### Step 1: Install Netlify CLI

```powershell
npm install -g netlify-cli
```

### Step 2: Build Your Project

```powershell
cd web
npm run build
```

### Step 3: Deploy

```powershell
netlify deploy
```

For production:
```powershell
netlify deploy --prod
```

---

## 🚀 OPTION 3: Deploy to Railway (Full-Stack)

Railway supports both frontend and backend, perfect for when you enable multiplayer.

### Step 1: Install Railway CLI

```powershell
npm install -g @railway/cli
```

### Step 2: Login

```powershell
railway login
```

### Step 3: Initialize Project

```powershell
railway init
```

### Step 4: Deploy Frontend

```powershell
cd web
railway up
```

### Step 5: Deploy Backend (when ready)

```powershell
cd ../server
railway up
```

---

## 🚀 OPTION 4: Deploy to Your Own VPS (Advanced)

### Recommended VPS Providers
- **DigitalOcean** - $5/month droplet
- **Linode** - $5/month
- **AWS Lightsail** - $3.50/month
- **Vultr** - $5/month

### Setup Steps

1. **Create Ubuntu 22.04 Server**
2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

4. **Clone Your Repository**
   ```bash
   git clone https://github.com/yourusername/poker.git
   cd poker/web
   npm install
   npm run build
   ```

5. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/poker
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       root /var/www/poker/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

6. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/poker /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 📦 Build Configuration Files

### Environment Variables

Create `.env.production` in the `web` folder:

```env
VITE_NETWORK=mainnet
VITE_CHAIN_ID=9008
VITE_RPC_URL=https://rpc-nodes.shidoscan.com
VITE_WS_URL=wss://ws-nodes.shidoscan.com
VITE_TABLE_CONTRACT=YOUR_DEPLOYED_CONTRACT_ADDRESS
VITE_SERVER_URL=https://your-backend-url.com
```

---

## 🔧 Post-Deployment Checklist

### Frontend
- [ ] Game loads correctly
- [ ] Cards display properly
- [ ] Animations work
- [ ] Demo mode functional
- [ ] Console has no errors

### Smart Contracts (When Ready)
- [ ] Deploy TableFactory to Shido network
- [ ] Deploy TableEscrow instances
- [ ] Deploy RakeVault
- [ ] Verify contracts on explorer
- [ ] Update frontend with contract addresses

### Backend (When Multiplayer Enabled)
- [ ] Server deployed and running
- [ ] WebSocket connections working
- [ ] Signature generation configured
- [ ] Database connected (if using one)

### Domain & SSL
- [ ] Custom domain pointed to hosting
- [ ] SSL certificate installed (HTTPS)
- [ ] WWW redirect configured

### Performance
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] Gzip compression enabled
- [ ] CDN configured

### Security
- [ ] Environment variables secured
- [ ] API keys not exposed in frontend
- [ ] Rate limiting configured
- [ ] CORS properly set

---

## 🌐 Custom Domain Setup

### Using Vercel with Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `poker.yourdomain.com`
3. Update your DNS records:
   - Type: `CNAME`
   - Name: `poker` (or `@` for root)
   - Value: `cname.vercel-dns.com`

### Using Netlify with Custom Domain

1. Go to Netlify Dashboard → Domain Settings
2. Add custom domain
3. Update DNS:
   - Type: `A`
   - Name: `@`
   - Value: `75.2.60.5` (Netlify's IP)

---

## 📊 Monitoring & Analytics

### Add Analytics (Optional)

1. **Google Analytics**
   ```typescript
   // Add to main.tsx
   import ReactGA from 'react-ga4';
   ReactGA.initialize('G-XXXXXXXXXX');
   ```

2. **Vercel Analytics** (if using Vercel)
   ```powershell
   npm install @vercel/analytics
   ```
   
   ```typescript
   // Add to main.tsx
   import { Analytics } from '@vercel/analytics/react';
   
   <Analytics />
   ```

---

## 🔥 Quick Deploy Commands

### Vercel (Recommended)
```powershell
cd web
npm run build
vercel --prod
```

### Netlify
```powershell
cd web
npm run build
netlify deploy --prod
```

### Manual Build
```powershell
cd web
npm run build
# Upload dist/ folder to your hosting
```

---

## 🐛 Troubleshooting

### Build Fails
```powershell
# Clear cache and rebuild
cd web
rm -rf node_modules dist
npm install
npm run build
```

### 404 Errors on Refresh
- Add `_redirects` file (Netlify) or configure routing
- Ensure SPA fallback is enabled

### Assets Not Loading
- Check `vite.config.ts` base path
- Verify asset paths are relative

### WebSocket Connection Fails
- Update server URL in environment variables
- Check CORS settings on backend

---

## 💰 Cost Estimates

| Platform | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Vercel** | 100GB bandwidth/month | $20/month | Frontend hosting |
| **Netlify** | 100GB bandwidth/month | $19/month | Static sites |
| **Railway** | $5 credit/month | $5-20/month | Full-stack apps |
| **DigitalOcean** | None | $5+/month | Full control |
| **AWS** | 12 months free | Variable | Enterprise scale |

---

## 🎯 Recommended Setup for Your Poker Game

### Phase 1: Demo Mode (Current)
**Host:** Vercel (Free)
**Why:** Fast, free, perfect for frontend-only demo mode
**Command:** `vercel --prod` from web directory

### Phase 2: Multiplayer
**Frontend:** Vercel or Netlify
**Backend:** Railway or DigitalOcean
**Database:** Railway Postgres or MongoDB Atlas
**Contracts:** Deploy to Shido Mainnet

### Phase 3: Production Scale
**Frontend:** Vercel Pro with custom domain
**Backend:** AWS EC2 or DigitalOcean droplets (load balanced)
**Database:** AWS RDS or managed PostgreSQL
**CDN:** CloudFlare
**Monitoring:** Sentry + DataDog

---

## 🚀 Deploy NOW (Fastest Path)

### 1. Build the frontend:
```powershell
cd c:\Users\dj_ba\Desktop\Poker\web
npm run build
```

### 2. Deploy to Vercel:
```powershell
npm install -g vercel
vercel --prod
```

### 3. Share the live URL!
Your game will be live in ~2 minutes at a URL like:
`https://shido-poker-xyz123.vercel.app`

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Railway Docs:** https://docs.railway.app
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html

---

## ✅ Next Steps

1. ✅ **Choose hosting platform** (Vercel recommended)
2. ✅ **Run build command** in web directory
3. ✅ **Deploy using CLI or dashboard**
4. ✅ **Test live site thoroughly**
5. ✅ **Add custom domain** (optional)
6. ✅ **Deploy smart contracts** (when ready for real money)
7. ✅ **Enable backend server** (when adding multiplayer)

Your poker game is **ready to deploy**! 🎉
