// Creates (or promotes) the FIRST admin in Firestore.
//
// Usage:  npm run seed:admin -- you@example.com [--verify]
//
// --verify also marks that Firebase Auth account's email as verified (only works
// if the account already exists). Admin power is ignored for unverified emails.
import "./load-env.js";
import { getAuth } from "../src/lib/firebase.js";
import { seedAdmin } from "../src/lib/userStore.js";

const email = process.argv[2];
if (!email || email.startsWith("--")) {
  console.error("Usage: npm run seed:admin -- you@example.com [--verify]");
  process.exit(1);
}

const id = await seedAdmin(email);
console.log(`Done: ${id} is now an admin in Firestore (users/${id}).`);

try {
  const account = await getAuth().getUserByEmail(id);
  if (account.emailVerified) {
    console.log("Firebase account found, email already verified.");
  } else if (process.argv.includes("--verify")) {
    await getAuth().updateUser(account.uid, { emailVerified: true });
    console.log("Firebase account found, email marked as verified.");
  } else {
    console.log("Firebase account found but email is NOT verified. Re-run with --verify, or verify via email link / Google sign-in.");
  }
} catch (err) {
  if (err.code === "auth/user-not-found") {
    console.log("No Firebase account with that email yet. Sign up with it, then verify the email.");
  } else {
    throw err;
  }
}
process.exit(0);
