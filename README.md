# GO An Nahl — Rumah Tahfidz Management System

Sistem manajemen data santri & SPP Rumah Tahfidz An Nahl.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite local / Supabase PostgreSQL production)
- **Auth**: Custom session-based (cookie)
- **State**: Zustand + TanStack Query

## Quick Start (Local)

```bash
# 1. Install dependencies
bun install

# 2. Setup database
cp .env.example .env  # edit if needed
bun run db:push

# 3. Run dev server
bun run dev

# 4. Open http://localhost:3000
#    - On first run, Setup Wizard will guide you to configure Supabase
#    - Or skip and use local SQLite directly
#    - Click "Inisialisasi Data Contoh" to seed 85 santri demo
```

## Default Accounts (after seed)
- admin / admin123 (Administrator)
- bendahara / bendahara123 (Bendahara)
- pengelola / pengelola123 (Pengelola)

## Features
- Dashboard with statistics & charts
- Santri management (CRUD, search, filter)
- Ustaz management
- Kelas (class) management
- Kelompok Belajar (study groups) with multi-day schedule
- SPP payment tracking with WhatsApp proof sending
- Reports & arrears (tunggakan)
- User management (admin/bendahara/pengelola roles)
- WhatsApp message templates & logs
- Database backup/restore
- Supabase connection setup wizard (first-run)

## Production Deployment (Vercel + Supabase)

1. Push this repo to GitHub
2. Import to Vercel
3. Set environment variables in Vercel Dashboard:
   - DATABASE_URL (Supabase PostgreSQL connection string)
   - DIRECT_URL (Supabase direct connection)
   - PRISMA_SCHEMA=prisma/schema.vercel.prisma
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   - SUPABASE_SERVICE_ROLE_KEY
4. Run the SQL schema in Supabase SQL Editor:
   - File: download/supabase-schema.sql
5. Deploy

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (REST endpoints)
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Main page (setup wizard OR app shell)
│   └── globals.css
├── components/
│   ├── ui/            # shadcn/ui components
│   ├── views/         # Page views (dashboard, santri, etc.)
│   ├── sidebar.tsx
│   ├── topbar.tsx
│   ├── bottom-nav.tsx
│   ├── app-shell.tsx
│   └── ...
├── lib/
│   ├── db.ts          # Prisma client
│   ├── supabase.ts    # Supabase client (browser + server)
│   ├── supabase-config.ts  # Runtime config storage
│   ├── auth.ts
│   ├── session-store.ts
│   └── ...
└── hooks/
prisma/
├── schema.prisma          # SQLite (local dev)
└── schema.vercel.prisma   # PostgreSQL (production)
```

## License
© Rumah Tahfidz An Nahl. All rights reserved.
