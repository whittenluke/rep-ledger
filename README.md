# Rep Ledger

Workout tracker PWA. See `Documentation/DesignDoc.md` for the full design.

## Setup

1. **Dependencies:** `npm install`
2. **Supabase:** Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project (Settings → API).
3. **Auth redirect:** In Supabase Dashboard → Authentication → URL Configuration, add your app URL (e.g. `http://localhost:5173`) and redirect URL `http://localhost:5173/auth/callback`.

## Run

- `npm run dev` — development
- `npm run build` — production build
- `npm run preview` — preview production build
