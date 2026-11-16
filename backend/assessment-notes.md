# Assessment implementation notes

## Password hashing: deliberate deviation from the brief

The assessment requests bcrypt. This implementation deliberately uses
**Argon2id instead**, at the project owner's request.

| Topic | Decision and reason |
| --- | --- |
| Algorithm | Argon2id, a salted, memory-hard password-hashing algorithm |
| Why not bcrypt? | Bcrypt has a 72-byte input limit. Multibyte Unicode passwords reach it with fewer than 72 characters. Depending on the implementation, excess bytes may be ignored; this project avoids that limit by using Argon2id, not by truncating or pre-hashing passwords. |
| Password policy | The same 8–128 Unicode code point limit applies to signup and login. This is an application limit, not an Argon2 input restriction. |
| Parameters | 64 MiB memory, 3 iterations, parallelism 1; the library generates a fresh random salt per hash. Parameters should be benchmarked against production capacity. |
| Stored data | Only the encoded Argon2id hash is stored. It includes algorithm, salt, and parameters; plaintext passwords are never persisted. |
| Old accounts | No bcrypt runtime or compatibility fallback remains. Existing bcrypt hashes cannot be converted without a password; affected accounts need a password reset or manual recreation. No automatic deletion is performed. A password-reset endpoint is not part of this version. |

Argon2id does not make passwords or authentication invulnerable. HTTPS, secure
secret handling, rate limiting, and ownership checks remain necessary.

## Reading edits

Only the glucose value is editable. Date and slot stay fixed after creation.
Correcting a mistaken date or slot requires deleting and recreating the reading.
Past-date creation is supported; future-date creation is rejected.

## Other deliberate scope decisions

- Backend only so far; the React frontend is the next phase.
- No seed script, at the project owner's request, despite the brief requesting one.
- Doctor/patient roles are stored, but every user can access only their own data.
  Doctor-patient assignments and cross-user reports are not implemented.
