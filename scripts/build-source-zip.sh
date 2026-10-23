#!/bin/bash
# Build a clean source code zip for download.
# Excludes: node_modules, .next, skills, .git, db, dev.log, upload, extracted

set -e
cd /home/z/my-project

OUT="download/go-an-nahl-source.zip"
TMP_STAGING="/tmp/go-an-nahl-staging"

# Clean previous output
rm -f "$OUT"
rm -rf "$TMP_STAGING"
mkdir -p "$TMP_STAGING/go-an-nahl"

# Copy source files (whitelist approach)
echo "[1/6] Copying source code..."
cp -r src "$TMP_STAGING/go-an-nahl/"
cp -r prisma "$TMP_STAGING/go-an-nahl/"
cp -r public "$TMP_STAGING/go-an-nahl/"
cp -r scripts "$TMP_STAGING/go-an-nahl/"

# Individual config files
cp package.json "$TMP_STAGING/go-an-nahl/"
cp next.config.ts "$TMP_STAGING/go-an-nahl/"
cp tsconfig.json "$TMP_STAGING/go-an-nahl/"
cp tailwind.config.ts "$TMP_STAGING/go-an-nahl/"
cp postcss.config.mjs "$TMP_STAGING/go-an-nahl/"
cp eslint.config.mjs "$TMP_STAGING/go-an-nahl/"
cp components.json "$TMP_STAGING/go-an-nahl/"
cp Caddyfile "$TMP_STAGING/go-an-nahl/" 2>/dev/null || true
cp vercel.json "$TMP_STAGING/go-an-nahl/" 2>/dev/null || true
cp bun.lock "$TMP_STAGING/go-an-nahl/" 2>/dev/null || true

# Create .env.example with credentials from current .env
echo "[2/6] Generating .env.example..."
cat > "$TMP_STAGING/go-an-nahl/.env.example" <<'EOF'
# === GO An Nahl — Environment Variables ===

# === DATABASE (Local SQLite for development) ===
DATABASE_URL=file:/home/z/my-project/db/custom.db

# === Supabase Client (public, safe for browser) ===
NEXT_PUBLIC_SUPABASE_URL=https://kciglknjiosjbxfmtqjo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_mTLpKPR7YyTpcrgMW6ySjw_iD3rsG7B

# === Supabase Service Role (server-only, bypasses RLS) ===
# Get from: Supabase Dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=

# === PRODUCTION (Vercel + Supabase PostgreSQL) ===
# Uncomment & set these for production deployment:
# DATABASE_URL=postgresql://postgres.kciglknjiosjbxfmtqjo:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
# DIRECT_URL=postgresql://postgres:[PASSWORD]@db.kciglknjiosjbxfmtqjo.supabase.co:5432/postgres
# PRISMA_SCHEMA=prisma/schema.vercel.prisma
EOF

# Also create a .env file with current values so user can run immediately
echo "[3/6] Generating .env..."
cp .env "$TMP_STAGING/go-an-nahl/.env" 2>/dev/null || cp "$TMP_STAGING/go-an-nahl/.env.example" "$TMP_STAGING/go-an-nahl/.env"

# Create README
echo "[4/6] Generating README.md..."
cat > "$TMP_STAGING/go-an-nahl/README.md" <<'EOF'
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
EOF

# Create supabase-config.json with current credentials (so wizard shows as configured)
echo "[5/6] Including supabase-config.json..."
cp supabase-config.json "$TMP_STAGING/go-an-nahl/" 2>/dev/null || true

# Create .gitignore
cat > "$TMP_STAGING/go-an-nahl/.gitignore" <<'EOF'
# dependencies
node_modules/

# next.js
.next/
out/

# production
build/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
bun-debug.log*

# local env files
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
/prisma/migrations/

# db files
*.db
*.db-journal
db/

# logs
dev.log
*.log

# supabase runtime config (contains service_role key — DO NOT commit)
# Uncomment to ignore:
# supabase-config.json
EOF

# Build zip
echo "[6/6] Building zip..."
cd "$TMP_STAGING"
zip -r -q "/home/z/my-project/$OUT" go-an-nahl/

# Clean staging
rm -rf "$TMP_STAGING"

# Report
cd /home/z/my-project
echo ""
echo "=== Done ==="
ls -lh "$OUT"
echo ""
echo "Contents:"
unzip -l "$OUT" | tail -20
