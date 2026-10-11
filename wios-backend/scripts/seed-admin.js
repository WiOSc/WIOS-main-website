// Creates (or promotes) the FIRST admin in Firestore.
//
// Usage:  npm run seed:admin -- you@example.com [--verify]
//
// --verify also marks that Firebase Auth account's email as verified (only works
// if the account already exists). Admin power is ignored for unverified emails.
import { assertEnv } from "../src/config/env.js";
import { firebaseAuth } from "../src/config/firebase.js";
import { seedAdmin } from "../src/services/userStore.js";

assertEnv(["FIREBASE_PROJECT_ID", "FIREBASE_SERVICE_ACCOUNT_PATH"]);

const email = process.argv[2];
if (!email || email.startsWith("--")) {
  console.error("Usage: npm run seed:admin -- you@example.com [--verify]");
  process.exit(1);
}

const id = await seedAdmin(email);
console.log(`Done: ${id} is now an admin in Firestore (users/${id}).`);

try {
  const account = await firebaseAuth.getUserByEmail(id);
  if (account.emailVerified) {
    console.log("Firebase account found, email already verified.");
  } else if (process.argv.includes("--verify")) {
    await firebaseAuth.updateUser(account.uid, { emailVerified: true });
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
