# VELOop Rewards Wallet & Payout System

A full-stack rewards wallet and payout demonstration built using the MERN stack. The application provides a server-authoritative wallet, transaction ledger, configurable payout catalogue, and withdrawal management workflow.

**Live Demo:** https://veloop-wallet-taupe.vercel.app/  
**Backend API:** https://veloop-wallet-api.onrender.com  
**GitHub Repository:** https://github.com/prateek2k5/veloop-wallet

> This is an independent internship task implementation and is not connected to VELoop production systems or credentials.

## Tech Stack

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcryptjs

**Frontend**
- React 19
- Vite
- JavaScript
- CSS

**Deployment & Tools**
- GitHub
- GitHub Actions (CI)
- Render (Backend Hosting)
- Vercel (Frontend Hosting)
- MongoDB Atlas (Database)

## Features

### Authentication
- User signup and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected API routes.

### Digital Wallet
- Server-authoritative wallet balances.
- Supports five wallet currencies:
  - VEs
  - SVEs
  - Gems
  - Tokens
  - Spins
- Wallet summary and transaction history.
- Paginated transaction API.

### Payout System
- Configurable payout methods and options.
- Payout options fetched dynamically from the backend.
- Withdrawal requests with immediate VEs deduction.
- Wallet balance validation.
- Idempotency key to prevent duplicate withdrawal submissions.

### Transaction & Security
- Ledger-backed credit and debit operations.
- MongoDB transactions for financial operations.
- Audit records for withdrawal activities.
- Admin-only wallet credit/debit and withdrawal review APIs.
- Rejected withdrawals trigger a compensating VEs credit.
- Input validation, account status checks and rate limiting.

## Application Screens

- User login.
- Wallet dashboard with available balances.
- Recent transaction history.
- Payout methods and redemption options.
- Withdrawal request workflow.

## Project Architecture

```text
veloop-wallet/
│
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── seed/
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── index.html
│   └── package.json
│
├── tests/
├── postman/
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── API_DOCUMENTATION.md
├── DATABASE_DOCUMENTATION.md
├── TEST_CASES.md
├── package.json
└── README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/prateek2k5/veloop-wallet.git
cd veloop-wallet
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and configure:

```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_random_secret
CORS_ORIGIN=http://localhost:5173
DEMO_USER_PASSWORD=your_demo_password
```

Never commit your `.env` file or expose database credentials.

### 4. Seed demo data

```bash
npm run seed:demo
```

### 5. Start the backend

```bash
npm run dev
```

Backend runs at:

`http://localhost:5000`

### 6. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

`http://localhost:5173`

## Demo Account

Email: `demo@veloop.test`

Password: Configure through `DEMO_USER_PASSWORD` when seeding the database.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | User login |
| GET | `/api/wallet` | Get wallet |
| GET | `/api/wallet/summary` | Wallet summary |
| GET | `/api/wallet/transactions` | Transaction history |
| GET | `/api/payout/methods` | Available payout methods |
| GET | `/api/payout/options/:method` | Payout options |
| POST | `/api/withdrawals` | Create withdrawal |
| GET | `/api/withdrawals` | User withdrawals |
| GET | `/api/withdrawals/:withdrawalId` | Withdrawal details |

Admin-only endpoints are documented in `API_DOCUMENTATION.md`.

## Testing & Verification

### Automated Testing

**GitHub Actions CI: 4/4 checks passed**

The CI workflow includes:

- Backend JavaScript syntax validation.
- Backend automated unit tests (`npm test`).
- Frontend dependency installation.
- Frontend production build (`npm run build`).

### Deployment Verification

The following manual checks were completed on the deployed application:

- [x] Backend successfully deployed on Render.
- [x] MongoDB Atlas connection successful.
- [x] Frontend successfully deployed on Vercel.
- [x] Live user login verified.
- [x] Wallet dashboard and balances loaded.
- [x] Payout methods and options loaded.
- [x] Withdrawal request successfully created.
- [x] Wallet balance updated after withdrawal.
- [x] Withdrawal transaction appeared in wallet history.

### Additional Integration Tests

Database-backed scenarios requiring dedicated test execution include:

- Concurrent withdrawal handling.
- Duplicate idempotency-key submissions.
- Insufficient balance handling.
- Admin rejection and refund workflow.
- User ownership and authorization checks.

See [TEST_CASES.md](./TEST_CASES.md) for the detailed test plan and verification status.

## Withdrawal & Financial Logic

