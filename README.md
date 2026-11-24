# VELoop Rewards Wallet & Payout System

A backend-focused MERN demonstration of a server-authoritative rewards wallet, ledger, payout catalogue, and withdrawal workflow. This is an independent internship task implementation and is not connected to VELoop production systems or credentials.

## Technology
- Node.js and Express
- MongoDB and Mongoose
- JWT authentication
- React demonstration frontend (planned in the next milestone)

## Current backend capabilities
- Signup/login with bcrypt password hashing and JWT.
- Protected wallet balance, summary and paginated transaction APIs.
- Wallet currencies: VEs, SVEs, Gems, Tokens and Spins.
- Ledger-backed credit/debit services.
- Admin-only wallet credit/debit endpoints.
- Configurable payout options seeded from backend data.
- Withdrawal creation with immediate VEs deduction.
- MongoDB transaction for deduction + ledger + withdrawal + audit record.
- Idempotency key and unique index for duplicate submission prevention.
- Admin-only pending withdrawal review; rejection triggers a compensating VEs credit.
- Account status checks, input validation and basic endpoint rate limiting.

## Local setup

1. Clone the repository and enter the backend project folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and set your own MongoDB Atlas URI, long random JWT secret, and demo password. Never commit `.env`.
4. Ensure the Atlas database is configured for transactions (replica set).
5. Seed demo data:
   ```bash
   npm run seed:demo
   ```
6. Start the API:
   ```bash
   npm run dev
   ```
7. Open `http://localhost:5000/`.

## Demo account
The seed script creates `demo@veloop.test`. Set its password through `DEMO_USER_PASSWORD` in your local environment. The seed data is for local testing only.

## Main endpoints
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/wallet`
- `GET /api/wallet/summary`
- `GET /api/wallet/transactions`
- `GET /api/payout/methods`
- `GET /api/payout/options/:method`
- `POST /api/withdrawals`
- `GET /api/withdrawals`
- `GET /api/withdrawals/:withdrawalId`
- Admin-only: wallet credit/debit and withdrawal review routes.

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) and [DATABASE_DOCUMENTATION.md](./DATABASE_DOCUMENTATION.md) for full details.

## Financial-state decision
The demonstration deducts VEs immediately when a withdrawal is created. If it is rejected, the system issues a compensating credit and records it in the ledger. External payout execution is intentionally not automated; approval records the review outcome only.

## Security notes
- Wallet ownership always comes from the authenticated JWT.
- Client-provided payout amounts and required VEs are ignored; the backend reads the active payout option.
- Admin routes require an authenticated admin role.
- Sensitive operations are rate-limited.
- The included rate limiter uses process memory and is only suitable for a single-instance demo. A production multi-instance deployment should use Redis or another shared rate-limit store.
- Use only your own development database. Never use production credentials.

## Tests and verification
Run `npm test`. The project is being built in milestones; API integration tests and end-to-end frontend verification remain part of the next development pass. Manual test scenarios are listed in [TEST_CASES.md](./TEST_CASES.md).

## Scaling from 1,000 to 1,000,000 users
- Keep wallet mutations transactional and use conditional atomic updates.
- Retain an append-only ledger and periodically reconcile balances against ledger totals.
- Use idempotency keys with unique indexes for all money-moving requests.
- Add indexes around user IDs, transaction IDs, withdrawal IDs, status and creation time.
- Move payout execution and other slow external work to durable queues with retry policies and dead-letter handling.
- Cache read-only wallet summaries carefully, invalidating them after committed mutations; never use cache as the balance authority.
- Use distributed rate limiting, fraud/risk checks, device and account signals, and step-up verification for suspicious activity.
- Keep audit trails immutable and monitor transaction failures, payout latency, queue depth, reconciliation differences and unusual withdrawal patterns.
- Scale API workers horizontally while keeping all financial writes coordinated through MongoDB transactions or a dedicated ledger service.
- Add operational reconciliation with payout providers and alert on mismatches.

## Project status
Backend foundation and primary wallet/payout workflows are under implementation on the `feature/wallet-foundation` branch. Runtime integration testing, React demonstration frontend, deployment and final verification are still pending.
