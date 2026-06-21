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

  // Always inject the correct production API URL into the manifest extra.
  // The build step runs with REPLIT_DOMAINS="replit.com" (Expo proxy domain),
  // so any build-time computation of apiUrl ends up wrong. We fix it here at
  // serve time using the actual request host from the Replit proxy headers.
  const correctApiUrl = `${protocol}://${host}/api`;
  if (!manifestObj.extra) manifestObj.extra = {};
  if (!manifestObj.extra.expoClient) manifestObj.extra.expoClient = {};
  if (!manifestObj.extra.expoClient.extra) manifestObj.extra.expoClient.extra = {};
  manifestObj.extra.expoClient.extra.apiUrl = correctApiUrl;

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
 * The build step runs with REPLIT_DOMAINS="replit.com" (Expo proxy), so Metro
 * bakes that domain into:
 *   - EXPO_PUBLIC_API_URL  → "https://replit.com/api"
 *   - httpServerLocation   → "https://replit.com/{ts}/_expo/static/js/..."
 *     (used by React Native to fetch fonts, images, and audio at runtime)
 *
 * We replace every "https://replit.com" occurrence with the real production
 * origin derived from the incoming request host header.
 */
function patchBundle(content, correctOrigin) {
  const wrongOrigins = ["https://replit.com", "http://replit.com"];
  let patched = content;
  for (const wrong of wrongOrigins) {
    // replaceAll is safe here: these strings only appear as Metro-baked string
    // literals (always wrapped in quotes) and never as legitimate substrings.
    patched = patched.replaceAll(wrong, correctOrigin);
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
