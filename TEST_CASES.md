# Test Cases and Verification Status

Run unit tests with `npm test`. Database-backed scenarios require a MongoDB Atlas development database configured as a replica set and a seeded demo account.

| ID | Scenario | Expected result | Verification |
|---|---|---|---|
| UT-01 | Positive whole-number amount | Accepted | Automated unit test |
| UT-02 | Zero, negative, fractional, unsafe or string amount | Rejected | Automated unit test |
| UT-03 | Supported currency mapping | Correct wallet field | Automated unit test |
| UT-04 | Unsupported currency | Rejected | Automated unit test |
| INT-01 | Credit 500 VEs | Balance increases and CREDIT ledger row is written | Pending local DB test |
| INT-02 | Withdraw with sufficient balance | VEs deducted; debit ledger and PENDING withdrawal created | Pending local DB test |
| INT-03 | Withdraw with insufficient balance | 400 response; no wallet/ledger/withdrawal mutation | Pending local DB test |
| INT-04 | Same Idempotency-Key submitted twice | One withdrawal and one deduction only | Pending local DB test |
| INT-05 | Two concurrent withdrawals exceeding balance together | At most the affordable request(s) commit | Pending local DB test |
| INT-06 | Unknown or inactive payout option | Request rejected | Pending local DB test |
| INT-07 | User A requests User B's withdrawal | 404; no data disclosure | Pending local DB test |
| INT-08 | Admin rejects withdrawal | VEs refunded and compensating CREDIT ledger row written | Pending local DB test |
| INT-09 | Non-admin calls admin route | 403 | Pending local DB test |
| INT-10 | Client tampers with payout amount/required VEs | Ignored; values resolved from PayoutOption | Pending local DB test |

Do not report integration scenarios as passed until they have been run against the local/Atlas development database. MongoDB transaction tests must run on a replica-set deployment.
