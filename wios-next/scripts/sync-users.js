// Copies everyone from Firebase Authentication into Firestore as role "user".
// Existing records (including admins) are left untouched.
// Usage: npm run sync-users
import "./load-env.js";
import { syncFromAuth } from "../src/lib/userStore.js";

const created = await syncFromAuth();
console.log(`Done: ${created} new user(s) added to Firestore as "user".`);
process.exit(0);
