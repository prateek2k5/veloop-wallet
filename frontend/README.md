# VELoop Wallet Demo Frontend

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`.
3. Set `VITE_API_URL=http://localhost:5000` (or your backend URL).
4. Start Vite: `npm run dev`
5. Open `http://localhost:5173`.

Log in with the demo account created by the backend seed script. Wallet balances and transaction history are fetched from the API; payout methods and denominations are fetched from the backend configuration.

This is an internship demonstration frontend. It stores the JWT in local storage for simplicity. A production integration should prefer secure, HttpOnly, SameSite cookies and a stricter CSRF strategy.
