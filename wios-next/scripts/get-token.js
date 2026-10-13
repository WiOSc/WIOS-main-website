// Prints a Firebase login token (idToken) for one account, to paste into Postman.
// Usage (PowerShell):
//   $env:TEST_EMAIL="you@x.com"; $env:TEST_PASSWORD="..."; node scripts/get-token.js
import "./load-env.js";

const { TEST_EMAIL, TEST_PASSWORD, FIREBASE_API_KEY } = process.env;
const res = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
  }
).then((r) => r.json());

console.log(res.idToken || res.error?.message);
