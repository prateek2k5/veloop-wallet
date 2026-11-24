# Database and Model Documentation

## Collections

### User
Stores identity, password hash, role, and account status. Password is bcrypt-hashed before save and excluded from ordinary queries. Roles are `user` and `admin`; account statuses are `active`, `suspended`, and `blocked`.

### Wallet
One wallet per user, uniquely indexed by `userId`. Stores integer balances for VEs, SVEs, Gems, Tokens, and Spins.

### WalletTransaction
Append-only ledger entry with unique transaction ID, user, currency, credit/debit type, amount, before/after balances, source, reference, status, description, metadata, and timestamps. User/time and user/currency/time indexes support history pagination.

### PayoutOption
Backend-controlled payout catalogue. Each option defines method, denomination, payout amount, required currency/balance, active flag, eligibility, required detail fields, and metadata. Seeded UPI options use the assignment's specified denominations and VEs requirements.

### Withdrawal
Stores withdrawal ID, user, method, option, currency amount, payout amount, payout details, status, review notes, related ledger transaction, idempotency key, and timestamps. A compound unique index on user and idempotency key prevents repeat submissions.

### AuditLog
Records sensitive actions such as withdrawal creation/review and admin wallet adjustments, including actor, target, action, reference and metadata.

## Balance strategy

This demo uses **immediate deduction**. When a withdrawal is accepted, required VEs are deducted immediately. The wallet update, debit ledger entry, withdrawal record and audit log are committed in one MongoDB transaction. If a withdrawal is rejected, the service restores the VEs and creates a compensating credit ledger entry in the same transaction as the status change.

Balance reconciliation follows:

`Current balance = opening credits + successful credits - successful debits + compensating adjustments`

Do not edit balances directly in the database. Use wallet services so each change has a ledger entry.

## Concurrency and idempotency

Wallet mutations use MongoDB sessions/transactions and conditional balance updates. A debit only succeeds if the current balance is sufficient. Withdrawal requests require an `Idempotency-Key`; a unique compound index prevents the same user/key from creating a second withdrawal.

## Demo seed

Run `npm run seed:demo` after configuring `DEMO_USER_PASSWORD`. The script creates a clearly labelled `demo@veloop.test` user, sample wallet balances, demo ledger records, and payout options. It does not create production data.
