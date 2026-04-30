# Marketing Site Deployment Guide

## 🚀 Deploy to Vercel

### Step 1: Create New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import the **same GitHub repository** (`adamwolfe2/cursive`)

### Step 2: Configure Root Directory

⚠️ **IMPORTANT:** Set the Root Directory to `marketing`

In the project settings:
- **Root Directory:** `marketing`
- **Framework Preset:** Next.js
- **Build Command:** `pnpm build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)

### Step 3: Environment Variables

No environment variables needed for the homepage! 🎉

(Later, if you add features that need API keys, add them here)

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your marketing site is live!

### Step 5: Custom Domain

1. Go to **Project Settings** → **Domains**
2. Add custom domain: `meetcursive.com`
3. Follow Vercel's DNS instructions
4. Wait for DNS propagation (~5-10 minutes)

---

## 🎨 What's Included

### Homepage Sections

1. **Hero Section**
   - "AI Intent Systems That Never Sleep" headline
   - Great Vibes cursive font
   - Smooth fade-in animations
   - Stats cards (500M+ contacts, 99% accuracy, 24/7 active)

2. **Enterprise Features, Startup Speed**
   - 4-column feature grid
   - Hover animations

3. **Visitor Identification Value Prop**
   - "Every visitor identified, enriched, and scored"
   - Large visual placeholder

4. **AI Agents Workflow**
   - "Connect Your Stack" card
   - System diagram placeholder

5. **Services Overview**
   - "Forget Separate Tools, Get Them All in One"
   - 6-8 service cards

6. **Final CTA**
   - Gradient background
   - "Unlock Your Intelligence Layer With Cursive"
   - Call-to-action button

### Components

- **Header:** Sticky navigation with logo, links, login, and "Book a Call" CTA
- **Footer:** 4-column layout with links to services, platform, company
- **Button:** Reusable button component with variants (default, outline, ghost)
- **Container:** Max-width container with responsive padding

### Styling

- **Colors:**
  - Primary: `#007AFF` (blue)
  - Hover: `#0066DD`
  - Secondary: `#6366f1`
  - Accent: `#8b5cf6`

- **Fonts:**
  - Body: Inter (Google Fonts)
  - Cursive: Great Vibes (Google Fonts)

- **Animations:**
  - Framer Motion for smooth scroll animations
  - Hover effects on cards and buttons
  - Fade-in-up animations

---

## 📝 Next Steps

### Update Calendly Link

Replace placeholder Calendly link in:
- `marketing/app/page.tsx` (3 locations)
- `marketing/components/header.tsx`
- `marketing/components/footer.tsx`

Find/replace: `https://cal.com/cursiveteam/30min` → Your actual Calendly link

### Add Real Images

Replace placeholder sections with actual images:
1. Dashboard screenshot for hero section
2. Intent scoring visualization
3. AI agent workflow diagram
4. Feature screenshots

Images go in: `marketing/public/images/`

### Build Remaining Pages

Create these pages next:
- `/services` - Detailed service tier breakdown
- `/pricing` - Pricing cards with Stripe checkout links
- `/platform` - Feature showcase with interactive demos
- `/about` - Company story

---

## 🛠️ Local Development

```bash
cd marketing
pnpm install
pnpm dev
```

Site runs at: http://localhost:3000

---

## ✅ Deployment Checklist

- [ ] Created new Vercel project
- [ ] Set Root Directory to `marketing`
- [ ] Build succeeded (check deployment logs)
- [ ] Added custom domain `meetcursive.com`
- [ ] DNS configured and propagated
- [ ] Updated Calendly links
- [ ] Tested all navigation links
- [ ] Mobile responsive (check on phone)

---

## 🎯 Current Setup

**Product App:**
- Domain: `leads.meetcursive.com`
- Directory: `/src` (root of repo)
- Vercel Project: (existing)

**Marketing Site:**
- Domain: `meetcursive.com` (NEW)
- Directory: `/marketing`
- Vercel Project: (NEW - to be created)

Both sites share the same GitHub repo but deploy independently.

---

## 🐛 Troubleshooting

**Build fails with "Module not found"**
- Make sure Root Directory is set to `marketing` in Vercel
- Check that `next.config.ts` has `turbopack.root: __dirname`

**Fonts not loading**
- Great Vibes is loaded from Google Fonts
- Check browser console for errors
- Verify `app/layout.tsx` imports fonts correctly

**Animations not working**
- Framer Motion requires client components
- Check that components using `motion` have `"use client"` at top

---

Need help? Check the [Next.js Docs](https://nextjs.org/docs) or [Vercel Docs](https://vercel.com/docs).
