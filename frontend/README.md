# FinanceTracker

React + Tailwind CSS frontend for the FinanceTracker Express/Supabase backend.

## Run locally

1. Install Node.js (LTS).
2. Copy `../backend/.env.example` to `../backend/.env` and configure the Supabase URL and publishable key from your Supabase project. Never put a Supabase service-role key in the frontend.
3. Copy `.env.example` to `.env` if the backend uses a different address than `http://localhost:5000`; set `VITE_API_BASE_URL` to the backend origin (without an `/api` suffix).
4. Start the backend from `../backend` with `npm start`.
5. Run `npm install` and `npm run dev` from this folder.
6. Create an account and sign in. Then add income or expense transactions and portfolio investments. These are fetched from the authenticated backend when the app loads and are saved in Supabase.

The backend permits the Vite origins `http://localhost:5173` and `http://127.0.0.1:5173` by default. Set `FRONTEND_ORIGINS` in the backend `.env` to a comma-separated list when using different frontend origins.

Finance API calls use the access token returned by the backend login flow. API failures are shown in the app, and failed form submissions remain open so they can be corrected or retried.

The backend schema stores income/expense source or category, amount, description, and date. Portfolio records store asset name/type, quantity, and per-unit purchase price. Extra frontend-only fields (such as payment method, account association, notes, ticker symbol, and manually entered current portfolio value) are cached in this browser and survive a page refresh, but are not synced across devices.

The assistant uses local calculations, and investment prices are not live market prices.
