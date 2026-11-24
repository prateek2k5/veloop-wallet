# VELoop Wallet API

Base URL (local): `http://localhost:5000`

All wallet, payout and withdrawal routes require:
`Authorization: Bearer <JWT>`

## Authentication

### POST /api/auth/signup
Body:
```json
{ "name": "Demo User", "email": "user@example.com", "password": "password123" }
```
Returns a JWT and user profile.

### POST /api/auth/login
Body:
```json
{ "email": "user@example.com", "password": "password123" }
```
Returns a JWT and user profile.

Authentication endpoints are rate-limited. Never send passwords or JWTs to logs or public repositories.

## Wallet

### GET /api/wallet
Returns the authenticated user's wallet. The user ID is taken from the JWT, never from a query parameter.

### GET /api/wallet/summary
Returns `ves`, `sves`, `gems`, `tokens`, and `spins`.

### GET /api/wallet/transactions?page=1&limit=20
Returns a paginated ledger. `limit` is capped at 100.

### POST /api/wallet/credit (admin only)
### POST /api/wallet/debit (admin only)
Body:
```json
{
  "userId": "MongoDB user id",
  "currency": "VES",
  "amount": 500,
  "source": "ADMIN_CREDIT",
  "description": "Approved support adjustment"
}
```
Allowed currencies: `VES`, `SVES`, `GEMS`, `TOKENS`, `SPINS`.
Credit sources and debit sources are validated by the wallet service. These endpoints must never be exposed to ordinary users.

## Payout configuration

### GET /api/payout/methods
Returns the supported method catalogue and active options. Current seeded denominations are UPI only. Other supported method groups are returned with empty options until their current denominations and required details are configured.

### GET /api/payout/options/:method
Supported method keys: `upi`, `paypal`, `amazon`, `google_play`.

## Withdrawals

### POST /api/withdrawals
Headers:
```
Authorization: Bearer <JWT>
Idempotency-Key: <unique-client-generated-key>
```
Body for UPI:
```json
{
  "optionId": "upi_100",
  "payoutDetails": { "upiId": "name@bank" }
}
```
The client does not submit a payout amount or VEs amount. The server looks up the active option and calculates both values.

The backend immediately deducts the required VEs and writes the debit ledger entry, withdrawal request, and audit log in one MongoDB transaction. The request starts as `PENDING`. A repeated request with the same user and idempotency key returns the existing request.

### GET /api/withdrawals?page=1&limit=20
Lists the authenticated user's withdrawals.

### GET /api/withdrawals/:withdrawalId
Returns one withdrawal owned by the authenticated user.

### GET /api/withdrawals/admin/pending (admin only)
Lists pending and processing withdrawals.

### PATCH /api/withdrawals/admin/:withdrawalId/review (admin only)
Approve:
```json
{ "decision": "APPROVED", "reviewNote": "Payout processed externally" }
```
Reject:
```json
{ "decision": "REJECTED", "reason": "Invalid payout details", "reviewNote": "Checked by support" }
```
A rejection refunds the previously deducted VEs and writes a compensating credit ledger entry in the same database transaction. Approval records the review status; actual money transfer is outside this demonstration and must be completed by an authorized payout provider/operator.

## Common errors

- `400`: validation error or insufficient balance
- `401`: missing, invalid, or expired JWT
- `403`: inactive account or insufficient role/eligibility
- `404`: resource not found
- `409`: invalid state transition or duplicate conflict
- `429`: rate limit exceeded
- `500`: generic server error; internal database details are not returned

## Operational notes

MongoDB transactions require a replica set. MongoDB Atlas clusters support this. The included in-memory rate limiter is suitable only for a single-process demo; use a shared store such as Redis for multiple backend instances.
