// Usage: npm run set-role -- someone@email.com user
//        npm run set-role -- someone@email.com admin
// No "last admin" protection here: be careful when demoting.
import "./load-env.js";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../src/lib/firebase.js";

const [email, role] = [process.argv[2]?.trim().toLowerCase(), process.argv[3]];
if (!email || !["admin", "user"].includes(role)) {
  console.error("Usage: npm run set-role -- someone@email.com user|admin");
  process.exit(1);
}

const ref = getDb().collection("users").doc(email);
if (!(await ref.get()).exists) {
  console.error(`No users/${email} document found. Check the email spelling, or run: npm run sync-users`);
  process.exit(1);
}

await ref.update({ role, roleChangedBy: "set-role-script", updatedAt: FieldValue.serverTimestamp() });
console.log(`Done: ${email} is now "${role}".`);
process.exit(0);
