// Lists every account in Firebase Authentication (email, sign-in method, verified, disabled).
// Usage: npm run list-auth-users
import "./load-env.js";
import { getAuth } from "../src/lib/firebase.js";

const { users } = await getAuth().listUsers(1000);
if (!users.length) console.log("No users in Firebase Authentication.");
for (const u of users) {
  console.log(
    JSON.stringify(u.email),
    "| providers:", u.providerData.map((p) => p.providerId).join(", ") || "none",
    "| verified:", u.emailVerified,
    "| disabled:", u.disabled
  );
}
process.exit(0);
