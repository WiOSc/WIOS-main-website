// Loads .env.local (what Next.js uses) so the scripts see the same settings.
// Import this FIRST in every script:  import "./load-env.js";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" }); // fallback; does not override values already set
