/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with two special routes:
 * - GET / or /manifest with expo-platform header → platform manifest JSON
 * - GET / without expo-platform → landing page HTML
 * Everything else falls through to static file serving from ./static-build/.
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const TEMPLATE_PATH = path.resolve(__dirname, "templates", "landing-page.html");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, "..", "app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveManifest(req, platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(
      JSON.stringify({ error: `Manifest not found for platform: ${platform}` }),
    );
    return;
  }

  // Derive the public origin from the incoming request so the manifest always
  // points to the correct server — even when the baked-in domain is stale.
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const currentOrigin = `${protocol}://${host}`;

  let manifestObj;
  try {
    manifestObj = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to parse manifest." }));
    return;
  }

  // Rewrite any absolute URL in the manifest to use the current origin.
  function rewriteUrl(url) {
    if (!url || !url.startsWith("http")) return url;
    try {
      const u = new URL(url);
      u.protocol = protocol + ":";
      u.host = host;
      return u.toString();
    } catch {
      return url;
    }
  }

  if (manifestObj.launchAsset?.url) {
    manifestObj.launchAsset.url = rewriteUrl(manifestObj.launchAsset.url);
  }
  if (manifestObj.assets) {
    manifestObj.assets = manifestObj.assets.map((a) =>
      a.url ? { ...a, url: rewriteUrl(a.url) } : a,
    );
  }
  // Rewrite Expo Updates / project URLs if present
  if (manifestObj.extra?.expoClient?.updates?.url) {
    manifestObj.extra.expoClient.updates.url = rewriteUrl(
      manifestObj.extra.expoClient.updates.url,
    );
  }
  // Patch bundleUrl (SDK ≤48 classic manifest field) when present
  if (manifestObj.bundleUrl) {
    manifestObj.bundleUrl = rewriteUrl(manifestObj.bundleUrl);
  }

  // Always inject the Railway API URL into the manifest extra.
  // The game server is hosted on Railway (permanent, 24/7) — not on Replit.
  // The Expo bundle is still served from Replit (chip-society.replit.app) but
  // all API calls and Socket.IO connections go directly to Railway.
  const RAILWAY_API_URL = 'https://api-server-production-bbc2.up.railway.app/api';
  if (!manifestObj.extra) manifestObj.extra = {};
  if (!manifestObj.extra.expoClient) manifestObj.extra.expoClient = {};
  if (!manifestObj.extra.expoClient.extra) manifestObj.extra.expoClient.extra = {};
  manifestObj.extra.expoClient.extra.apiUrl = RAILWAY_API_URL;

  // Bust the Expo Go bundle cache by appending a serve-version suffix to the
  // launchAsset key. Without this, Expo Go re-uses its cached bundle from
  // before our serve-time URL patches were deployed, so fonts/images/audio
  // remain broken even after we publish fixes to serve.js.
  if (manifestObj.launchAsset) {
    manifestObj.launchAsset.key = (manifestObj.launchAsset.key || 'bundle') + '-s5';
  }

  const body = JSON.stringify(manifestObj);
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
    "content-length": Buffer.byteLength(body),
    // Force Expo Go to always re-fetch the manifest — never serve from cache.
    // This ensures the device sees the latest bundle URL after each publish.
    "cache-control": "no-store, no-cache, must-revalidate",
    "pragma": "no-cache",
    "expires": "0",
  });
  res.end(body);
}

function serveLandingPage(req, res, landingPageTemplate, appName) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

/**
 * Patch a JS bundle at serve time.
 *
 * The build step runs with whatever REPLIT_DOMAINS is set to at build time
 * (could be "replit.com", a janeway.replit.dev session domain, etc.). Metro
 * bakes that domain into httpServerLocation values — the URLs React Native
 * uses to fetch fonts, images, and audio at runtime.
 *
 * We detect whatever domain was baked in and replace it with the real
 * production origin derived from the incoming request host header.
 */
function patchBundle(content, correctOrigin) {
  let patched = content;

  // Dynamically detect the baked-in domain from the first httpServerLocation.
  // This handles any Replit domain: replit.com, *.janeway.replit.dev, etc.
  const locationMatch = patched.match(/httpServerLocation:"(https?:\/\/[^/"]+)\//);
  if (locationMatch) {
    const bakedOrigin = locationMatch[1];
    if (bakedOrigin !== correctOrigin) {
      patched = patched.replaceAll(bakedOrigin, correctOrigin);
    }
  }

  // Belt-and-suspenders: also replace the well-known static proxy domains.
  for (const wrong of ["https://replit.com", "http://replit.com"]) {
    if (patched.includes(wrong)) {
      patched = patched.replaceAll(wrong, correctOrigin);
    }
  }

  return patched;
}

function serveStaticFile(urlPath, req, res) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // Log 404s so we can diagnose asset loading failures via deployment logs.
    console.log(`[404] ${urlPath} -> ${filePath}`);
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  // Patch JS bundles: rewrite every "replit.com" reference (API URLs AND
  // httpServerLocation asset paths) to use the real production origin.
  if (ext === ".js") {
    const forwardedProto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers["host"] || "chip-society.replit.app";
    const correctOrigin = `${forwardedProto}://${host}`;
    const text = fs.readFileSync(filePath, "utf-8");
    const patched = patchBundle(text, correctOrigin);
    const buf = Buffer.from(patched, "utf-8");
    res.writeHead(200, { "content-type": contentType, "content-length": buf.length });
    res.end(buf);
    return;
  }

  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
}

const landingPageTemplate = fs.readFileSync(TEMPLATE_PATH, "utf-8");
const appName = getAppName();

// ─── Startup diagnostic: show what's in static-build so we can verify assets ──
(function logStaticBuildContents() {
  try {
    if (!fs.existsSync(STATIC_ROOT)) {
      console.log("[diag] static-build MISSING");
      return;
    }
    // List top-level timestamp dirs
    const top = fs.readdirSync(STATIC_ROOT);
    console.log("[diag] static-build/:", top.join(", "));
    for (const entry of top) {
      const fullEntry = path.join(STATIC_ROOT, entry);
      if (!fs.statSync(fullEntry).isDirectory()) continue;
      // Count and sample asset files (non-.js) inside each timestamp dir
      let assetCount = 0;
      let samples = [];
      function countAssets(dir, depth) {
        if (depth > 8) return;
        for (const f of fs.readdirSync(dir)) {
          const fp = path.join(dir, f);
          if (fs.statSync(fp).isDirectory()) { countAssets(fp, depth + 1); }
          else if (!['.js', '.json', '.map'].includes(path.extname(f))) {
            assetCount++;
            if (samples.length < 5) samples.push(path.relative(STATIC_ROOT, fp));
          }
        }
      }
      countAssets(fullEntry, 0);
      console.log(`[diag] ${entry}/: ${assetCount} assets. samples: ${samples.join(" | ")}`);
    }
  } catch (e) {
    console.log("[diag] error:", e.message);
  }
})();

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  if (pathname === "/" || pathname === "/manifest") {
    const platform = req.headers["expo-platform"];
    if (platform === "ios" || platform === "android") {
      return serveManifest(req, platform, res);
    }

    if (pathname === "/") {
      return serveLandingPage(req, res, landingPageTemplate, appName);
    }
  }

  serveStaticFile(pathname, req, res);
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Serving static Expo build on port ${port}`);
});
