/**
 * Seed past WiOS events from the old static website into Firestore,
 * uploading each event poster to UploadThing first.
 *
 * Usage (from backend/):
 *   node scripts/seed-old-events.cjs            # seed, skipping events that already exist
 *   node scripts/seed-old-events.cjs --force    # re-upload + overwrite existing seeded events
 *   node scripts/seed-old-events.cjs --dry      # parse + validate only, no uploads/writes
 *
 * Reads credentials from backend/.env (FIREBASE_SERVICE_ACCOUNT_JSON, UPLOADTHING_TOKEN).
 * Writes to the SAME `events` Firestore collection the admin panel uses, with the
 * same document shape as createEvent() in src/modules/events/events.service.ts.
 */

const fs = require("fs");
const path = require("path");

const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry");

const OLD_SITE_EVENTS = "/home/pranjalk/projects/wios/old-website/Events";

// ---- Event metadata extracted from the old static site -------------------
// venue is null where the old site did not state one (we do not invent data).
const EVENTS = [
  { folder: "wistia", title: "WISTIA - UI/UX Hands-on Workshop", description: "A UI/UX hands-on workshop with an ice-breaker session, games, and a practical UI/UX session.", dateISO: "2021-08-22", venue: null, posterFile: "event_poster2.png" },
  { folder: "hacktober", title: "Hacktoberfest 2021 - TechCast, Ep.4", description: "A talk on Data Analytics and Machine Learning, with a fun quiz and a Q&A session with the speaker.", dateISO: "2021-10-03", venue: null, posterFile: "hackotber fest.jpeg" },
  { folder: "react_1", title: "ReactX Ep.1 - Build an Escape Room Game with React", description: "A workshop building a simple escape-room game with ReactJS, covering JavaScript basics, React setup, components, the useState hook, and event handling. Speaker: Mr. Praveen Kumar Purushothaman, a Full Stack JavaScript Specialist.", dateISO: "2021-11-14", venue: null, posterFile: "Reactx.jpeg" },
  { folder: "react_2", title: "ReactX Ep.2 - Build a Job Portal with React and NodeJS", description: "A workshop building a simple job portal with React and Node.js, covering APIs, routing in SPAs, AJAX/service calls, and basic authentication. Speaker: Mr. Praveen Kumar Purushothaman.", dateISO: "2021-12-19", venue: null, posterFile: "banner.png" },
  { folder: "ai", title: "Demystify Artificial Intelligence & Machine Learning", description: "A session to familiarize attendees with AI/ML paradigms, real-life applications, and career paths in the field. Speaker: Mr. Anindya Chatterjee, Team Lead - AI and Advanced Analytics at Siemens.", dateISO: "2022-02-13", venue: null, posterFile: "AI.jpeg" },
  { folder: "Foss", title: "FOSS & GIT", description: "A three-day workshop on Git and GitHub: navigating open source, hands-on Git experience, and judging submitted PRs. Speakers: Dr. Sowmya Ranjan Sahoo, Anisha Gosh (Co-Founder, code2opensource), and Aditya Mithra (MLSA Beta).", dateISO: "2022-09-10", venue: null, posterFile: "foss.png" },
  { folder: "escaperoom", title: "Escape Room", description: "A thrilling escape-room challenge testing participants' will and quick thinking. Held at 4:00 pm.", dateISO: "2022-11-12", venue: "Newton Hall", posterFile: "banner.jpg" },
  { folder: "chunin shiken", title: "Chunin Shiken", description: "An interactive event with ACM and the null chapter of VIT-AP.", dateISO: "2022-11-26", venue: null, posterFile: "316874706_659118055908424_6885736225251897345_n.jpeg" },
  { folder: "squid games", title: "Squid Games", description: "A clue-decoding bounty-chase event, part of the upcoming VTAPP 2022.", dateISO: "2022-12-10", venue: null, posterFile: "318598498_476010387955086_1689549459571434571_n.jpeg" },
  { folder: "ishan sharma", title: "Speaker Session with Ishan Sharma", description: "An exciting speaker session with Ishan Sharma, part of the upcoming VTAPP 2022.", dateISO: "2022-12-11", venue: null, posterFile: "318672887_1174542679841407_3266310253414566189_n.jpeg" },
  { folder: "la casa del professor", title: "La Casa Del Professor", description: "A hacking-themed challenge where participants take on the role of the Professor to unlock the secrets of technology.", dateISO: "2023-04-15", venue: null, posterFile: "330211237_180369898173675_7027508320361378200_n.jpg" },
  { folder: "open tech summit", title: "Open Tech Summit with M.D. Moinuddin", description: "The OpenTech Summit Techcast with Mr. Moinuddin Mohammed, an open-source expert, exploring the power of open technology and its impact on the future.", dateISO: "2023-05-27", venue: null, posterFile: "348729206_485667760383388_8532706231079027993_n.jpeg" },
  { folder: "graphical gala", title: "The Graphical Gala", description: "A creative event to unleash creativity through computers.", dateISO: "2023-11-20", venue: null, posterFile: "401701747_1038059254102577_6473412339739191288_n.jpeg" },
  { folder: "Lunar Labs", title: "The Lunar Labs: Mission Chandrayan 3", description: "A race to unlock lunar secrets through design and code.", dateISO: "2024-02-23", venue: null, posterFile: "Lunar Labs.jpg" },
  { folder: "Takeshi's castle", title: "The Takeshi's Castle", description: "A battleground of coding and defusing the bomb.", dateISO: "2024-02-22", venue: null, posterFile: "Takeshi's_Castle.jpg" },
  { folder: "Ice breaker", title: "The Ice Breaker Session", description: "An official meet with stand-up comedy and a career-advice session, arranged by the WiOS Club for its members.", dateISO: "2024-04-17", venue: null, posterFile: "Ice Breaker Session.jpg" },
  { folder: "Open source talks", title: "Open Source Talks with Abhas Abhinav", description: "Episode 1 of the Open Source Talks series, featuring Abhas Abhinav sharing insights into the world of open source.", dateISO: "2024-05-01", venue: null, posterFile: "Abhas Abhinav.jpg" },
  { folder: "hackodisha", title: "HackOdisha", description: "WiOS was the official community partner of the HackOdisha hackathon held by NIT Rourkela.", dateISO: "2024-09-09", venue: null, posterFile: "hackodisha.jpg" },
  { folder: "grey to green", title: "Grey to Green in 45 Mins: Contributing to FOSS", description: "A speaker session (part of the FOSSItUp conference) with Mr. Rahul Poruri, CEO of FOSS United India, on effective ways to contribute to open-source projects.", dateISO: "2024-11-09", venue: null, posterFile: "grey to green in 45 mins.jpg" },
  { folder: "gsoc", title: "Navigating GSoC", description: "Anikate De and Shreyas S shared insights on navigating Google Summer of Code, with practical tips and strategies for success.", dateISO: "2024-11-14", venue: null, posterFile: "gsoc.jpg" },
  { folder: "generative ai and open source", title: "Generative AI and Open Source", description: "An online speaker session with Dr. Sunil Thomas Thonikuzhiyil, Director of ICFOSS Kerala, on how Generative AI aligns with FOSS.", dateISO: "2024-11-16", venue: null, posterFile: "generative ai and open source].jpg" },
  { folder: "ai in foss development", title: "Transformative Role of AI in FOSS Development", description: "A talk by Moinuddin Mohammed (Lead @ TensorFlow User Group Hyderabad, SDE in FinTech) on the transformative role of AI in FOSS development.", dateISO: "2024-11-23", venue: null, posterFile: "transformative role of ai in foss development.jpg" },
];

// ---- Minimal .env loader (all vars are single-line in this project) ------
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

async function main() {
  loadEnv();

  if (!process.env.UPLOADTHING_TOKEN) throw new Error("UPLOADTHING_TOKEN missing in .env");
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Firebase admin credentials missing in .env");
  }

  const admin = require("firebase-admin");
  const { UTApi, UTFile } = require("uploadthing/server");

  if (!admin.apps.length) {
    const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(svc) });
  }
  const db = admin.firestore();
  const { FieldValue } = admin.firestore;
  const utapi = new UTApi();

  console.log(`\nSeeding ${EVENTS.length} events  (force=${FORCE}, dry=${DRY})\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const ev of EVENTS) {
    const slug = slugify(ev.title);
    const posterPath = path.join(OLD_SITE_EVENTS, ev.folder, ev.posterFile);

    try {
      if (!fs.existsSync(posterPath)) {
        throw new Error(`poster not found: ${posterPath}`);
      }

      const docRef = db.collection("events").doc(slug);
      const existing = await docRef.get();
      if (existing.exists && !FORCE) {
        console.log(`  SKIP  ${slug}  (already exists; use --force to overwrite)`);
        skipped++;
        continue;
      }

      let posterUrl = "";
      let posterKey = "";

      if (!DRY) {
        const buffer = fs.readFileSync(posterPath);
        const safeName = `${slug}${path.extname(ev.posterFile).toLowerCase()}`;
        const utfile = new UTFile([buffer], safeName, { type: contentType(ev.posterFile) });
        const res = await utapi.uploadFiles(utfile);
        if (res.error || !res.data) {
          throw new Error(`upload failed: ${JSON.stringify(res.error)}`);
        }
        posterUrl = res.data.ufsUrl || res.data.url;
        posterKey = res.data.key;
      } else {
        posterUrl = `DRY_RUN_URL/${slug}`;
        posterKey = `DRY_RUN_KEY_${slug}`;
      }

      const nowIso = new Date(ev.dateISO).toISOString();
      const venue = ev.venue || "";
      const image = {
        url: posterUrl,
        key: posterKey,
        alt: ev.title,
        uploadedAt: nowIso,
      };

      const docData = {
        id: slug,
        slug,
        title: ev.title,
        description: ev.description,
        date: ev.dateISO,
        startsAt: ev.dateISO,
        venue,
        location: venue,
        category: "General",
        images: [image],
        allowEdit: false,
        status: "closed",
        theme: { accent: "#8D7FB5", poster: posterUrl, layout: "centered" },
        fields: [],
        createdBy: "seed-script",
        isSeeded: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!DRY) {
        await docRef.set(docData, { merge: false });
      }

      console.log(`  OK    ${slug}  (${ev.dateISO})  ${DRY ? "[dry]" : posterKey}`);
      created++;
    } catch (err) {
      console.error(`  FAIL  ${slug}  -> ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. created/updated=${created}  skipped=${skipped}  failed=${failed}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
