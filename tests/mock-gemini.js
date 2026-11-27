// Local test server: serves the app and fakes the two Gemini endpoints it uses, so the whole flow can be tested
// without a key or network.   node tests/mock-gemini.js 8787   → open http://localhost:8787 , then in the console:
//   localStorage.setItem('pmpsnap.api', 'http://localhost:8787/v1beta/'); localStorage.setItem('pmpsnap.v2', '{"key":"test"}'); location.reload()
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".webmanifest": "application/manifest+json", ".png": "image/png", ".json": "application/json" };
const seen = [];

const ANSWER = {
  found: true,
  question: "Two team members disagree on a technical approach; what should the project manager do first?",
  answer: "C",
  reason: "Facilitate a collaborative discussion so the team resolves the conflict itself — PMI favors collaboration over directing.",
  others: [
    { option: "A", why: "Escalating to the sponsor skips the team's chance to resolve it." },
    { option: "B", why: "Deciding alone is directive, not servant leadership." },
    { option: "D", why: "Ignoring conflict lets it grow and hurts delivery." }
  ],
  domain: "People",
  approach: "Agile"
};

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"); let body = ""; for await (const c of req) body += c;
  res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (u.pathname === "/v1beta/models") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ models: [
    { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-3.5-flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-3.5-flash-image", supportedGenerationMethods: ["generateContent"] } ] })); }
  const m = u.pathname.match(/^\/v1beta\/models\/([^:]+):generateContent$/);
  if (m) {
    if (req.headers["x-goog-api-key"] === "RATE") {                   // key "RATE" simulates the free-tier limit
      res.writeHead(429, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: { code: 429, message: "Quota exceeded", details: [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "6s" }] } }));
    }
    const j = JSON.parse(body || "{}"); seen.push({ model: decodeURIComponent(m[1]), key: req.headers["x-goog-api-key"], body: j });
    const parts = j.contents?.[0]?.parts || [];
    const hasImage = parts.some((p) => p.inlineData?.data?.length > 1000);
    const hasText = parts.some((p) => /Practice question:/.test(p.text || ""));
    const out = hasImage || hasText ? ANSWER : { found: false };
    await new Promise((r) => setTimeout(r, 700));                     // feel like a real call
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] } }] }));
  }
  if (u.pathname === "/seen") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(seen.map((s) => ({
    model: s.model, key: s.key, mime: s.body.generationConfig?.responseMimeType, thinking: s.body.generationConfig?.thinkingConfig,
    parts: (s.body.contents?.[0]?.parts || []).map((p) => (p.inlineData ? `image/jpeg ${p.inlineData.data.length} b64 chars` : p.text.slice(0, 60))),
    system: (s.body.systemInstruction?.parts?.[0]?.text || "").slice(0, 80) })))); }
  const f = path.join(root, u.pathname === "/" ? "index.html" : decodeURIComponent(u.pathname));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(+process.argv[2] || 8787, () => console.log("PMP Snap test server on http://localhost:" + (+process.argv[2] || 8787)));
