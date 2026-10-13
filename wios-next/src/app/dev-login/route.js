export const dynamic = "force-dynamic";

/**
 * DEVELOPMENT-ONLY helper page:  http://localhost:4000/dev-login
 * Signs in with Google in the browser, shows the Firebase ID token (to paste into
 * Postman / the test script) and can call the API for you.
 * It returns 404 when NODE_ENV is "production", so it never exists on a live site.
 * The values it embeds (apiKey etc.) are public Firebase web config, not secrets.
 */
const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WIOS dev login</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 760px; margin: 24px auto; padding: 0 16px; }
  button { padding: 8px 14px; margin: 4px 6px 4px 0; cursor: pointer; }
  textarea, pre { width: 100%; box-sizing: border-box; font-family: ui-monospace, monospace; font-size: 12px; }
  textarea { height: 110px; }
  pre { background: #f4f4f4; padding: 10px; overflow: auto; min-height: 80px; white-space: pre-wrap; }
  .note { color: #555; font-size: 14px; }
</style>
</head>
<body>
<h1>WIOS dev login</h1>
<p class="note">Development only. Sign in with a Google account, then copy the token or call the API.</p>

<p><button id="in">Sign in with Google</button> <button id="out">Sign out</button></p>
<p>Signed in as: <b id="who">(nobody)</b></p>

<p>ID token (valid ~1 hour):</p>
<textarea id="token" readonly placeholder="Sign in to see your token"></textarea>
<p><button id="copy">Copy token</button></p>

<p>Call the API with this token:</p>
<p>
  <button data-path="/api/me">GET /api/me</button>
  <button data-path="/api/files">GET /api/files</button>
  <button data-path="/api/admin/users">GET /api/admin/users</button>
</p>
<pre id="out-box">(response appears here)</pre>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
  import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

  const CONFIG = __CONFIG__;
  const auth = getAuth(initializeApp(CONFIG));
  const $ = (id) => document.getElementById(id);

  async function refresh(user) {
    $("who").textContent = user ? user.email : "(nobody)";
    $("token").value = user ? await user.getIdToken(true) : "";
  }

  $("in").onclick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      await refresh(result.user);
      // Tell the backend about the login so Firestore gets the user record.
      const t = await result.user.getIdToken();
      const res = await fetch("/api/auth/google", { method: "POST", headers: { Authorization: "Bearer " + t } });
      $("out-box").textContent = "POST /api/auth/google -> HTTP " + res.status + "\\n" + (await res.text());
    } catch (err) {
      $("out-box").textContent = "Sign-in failed: " + err.code + "\\n" + err.message;
    }
  };

  $("out").onclick = async () => {
    await signOut(auth);
    await refresh(null);
  };

  $("copy").onclick = async () => {
    await navigator.clipboard.writeText($("token").value);
    $("out-box").textContent = "Token copied.";
  };

  document.querySelectorAll("button[data-path]").forEach((btn) => {
    btn.onclick = async () => {
      if (!auth.currentUser) { $("out-box").textContent = "Sign in first."; return; }
      const token = await auth.currentUser.getIdToken(true);
      const res = await fetch(btn.dataset.path, { headers: { Authorization: "Bearer " + token } });
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch (e) {}
      $("out-box").textContent = "HTTP " + res.status + "\\n" + pretty;
    };
  });
</script>
</body>
</html>`;

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    appId: process.env.FIREBASE_APP_ID,
  };
  // Escape "<" so the JSON can never close the script tag.
  const json = JSON.stringify(config).replace(/</g, "\\u003c");

  return new Response(PAGE.replace("__CONFIG__", json), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
