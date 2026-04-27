# 🏏 Cricket Auction App

A production-ready cricket auction system with real-time updates via **Supabase Realtime**.

---

## Project Structure

```
cricket-auction/
├── supabase/
│   └── schema.sql          ← Run this in Supabase SQL Editor
├── src/
│   ├── lib/
│   │   ├── supabase.js     ← Supabase client (single instance)
│   │   └── constants.js    ← Teams, roles, colors, admin password
│   ├── hooks/
│   │   ├── usePlayers.js   ← All DB reads/writes + Realtime subscription
│   │   └── useToast.js     ← Toast notification hook
│   ├── components/
│   │   ├── AuctionStage.jsx   ← Admin: bid panel + player list
│   │   ├── PlayerPool.jsx     ← Browse available players
│   │   ├── TeamsView.jsx      ← View squads (admin can release players)
│   │   ├── PlayerCard.jsx     ← Reusable player card
│   │   ├── ConfirmModal.jsx   ← Release confirmation dialog
│   │   └── Toast.jsx          ← Notification toast
│   ├── pages/
│   │   ├── AdminPage.jsx   ← /admin  — full auction control (password-gated)
│   │   └── ViewerPage.jsx  ← /       — read-only live screen for audience
│   ├── styles/
│   │   └── global.css      ← Shared styles + animations
│   ├── App.jsx             ← Router (two routes: / and /admin)
│   └── main.jsx            ← Entry point
├── .env.example            ← Copy to .env and fill in credentials
├── index.html
├── package.json
└── vite.config.js
```

---

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **anon/public API key** from:
   - Dashboard → Settings → API

### 2. Run the Database Schema

1. In Supabase Dashboard → **SQL Editor**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run** — this creates the table, policies, and seeds all 100 players

### 3. Enable Realtime

In Supabase Dashboard:

- Go to **Database → Replication**
- Toggle ON the `players` table

_(The schema.sql already runs `alter publication supabase_realtime add table public.players` but the dashboard toggle is the easiest way to confirm it's on.)_

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_PASSWORD=your-secret-password
```

### 5. Install & Run

```bash
npm install
npm run dev
```

---

## URLs

| URL                           | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| `http://localhost:5173/`      | **Viewer screen** — share this link with audience        |
| `http://localhost:5173/admin` | **Admin panel** — password-protected, for the auctioneer |

---

## How It Works

```
Admin sells a player
       │
       ▼
Supabase DB updated (players table)
       │
       ▼
Supabase Realtime broadcasts the change via WebSocket
       │
       ▼
All viewer screens receive the update instantly
       │
       ▼
UI updates live — no page refresh needed
```

---

## Deployment (Production)

### Frontend (Vercel — free)

```bash
npm run build
# Deploy the `dist/` folder to Vercel / Netlify / any static host
# Add the same env vars in the hosting dashboard
```

### Environment Variables on Vercel

Add these in Vercel → Project Settings → Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_PASSWORD`

---

## Security Notes

- The **anon key** is safe to expose in the frontend — Supabase Row Level Security ensures:
  - Anyone can **read** players (viewers)
  - Only **authenticated** users can write (admin must be logged in)
- For a simpler setup, you can temporarily set RLS to allow all writes and rely on the password gate in the UI — but for production, use Supabase Auth.

---

## Adding More Players

Run in Supabase SQL Editor:

```sql
INSERT INTO public.players (id, name, role, base_price, rating)
VALUES (101, 'New Player', 'Batter', 100, 82);
```

## Generating Payment Links

Generate payment links csv with email and payment link columns from the registrations_rows.csv file present in the root directory of the project.

```bash
npm run generate:payment:links
```
