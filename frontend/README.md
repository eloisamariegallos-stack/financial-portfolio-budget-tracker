# Financial Portfolio and Budget Tracker

A React + Tailwind CSS personal finance frontend. The workspace starts empty; records are created only when you add them.

## Run locally

1. Install Node.js (LTS).
2. Open this folder in a terminal.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL printed by Vite.

## Account access

- Create an account with a name, email, and password.
- Sign in with the same email and password.
- Duplicate email addresses are rejected.
- Passwords are stored as salted PBKDF2 hashes in this browser's local storage.
- Financial records are saved separately for each locally registered account in this browser.
- Signing out returns to the login page; app pages require a local session.
- Password recovery is intentionally unavailable until a backend or trusted provider can verify account ownership. The frontend no longer lets someone reset a password using only a known email address.

## Important limitations

This is a frontend-only build. There is no backend or remote database, so accounts only exist in the browser where they were created and do not sync across devices or browsers. Browser storage can be cleared or modified, and frontend route guards can be bypassed by a technically capable user. The PBKDF2 hash is only a local demo safeguard; it is not equivalent to server-side password hashing or secure authentication. Email verification, real email password-reset links, server-side access control, and secure multi-user data storage require a backend/auth provider. The finance assistant uses local calculations, not an external AI service. Investment prices are entered manually and are not live market prices.

## Production security required

Before using real financial or personal information, connect a backend or trusted authentication provider. Enforce authentication and authorization on every private API endpoint, hash passwords server-side (for example with Argon2id or bcrypt), use secure HttpOnly/Secure/SameSite cookies or provider-managed sessions, implement verified email recovery, and store user data in a server-side database. Do not treat this local-only project as production-secure.
