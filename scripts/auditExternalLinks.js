#!/usr/bin/env node
// Scans the source tree for `https://...` URLs, fires HEAD (falling back
// to GET when HEAD is rejected), records the status, and writes a
// report to `deadLinks.json` in the repo root listing anything that
// returned 4xx, 5xx, DNS failure, or a timeout.
//
// Usage:
//   node scripts/auditExternalLinks.js
//   npm run audit:links
//
// Exit code:
//   0 — every URL resolved (or only redirected)
//   1 — at least one URL is broken (CI-friendly)
//
// Designed to be runnable on a weekly schedule (GitHub Action on
// every Monday in v1.3+) so dead links never live silently.

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const SCAN_DIRS = ["src", "App.js"].map((p) => path.join(REPO_ROOT, p));
const REPORT_PATH = path.join(REPO_ROOT, "deadLinks.json");
const URL_RE = /https?:\/\/[^\s)"'`<>]+/g;

// Strip trailing punctuation that often clings to URLs in prose.
function cleanURL(u) {
  return u.replace(/[.,;:!?)]+$/, "");
}

// JS template-literal placeholders (`${…}`) are filled in at runtime,
// so probing the literal source string always 4xx's. Skip them.
function isTemplateURL(u) {
  return u.includes("${") || u.includes("`");
}

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  if (fs.statSync(dir).isFile()) { yield dir; return; }
  for (const entry of fs.readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) yield* walk(full);
    else if (/\.(js|jsx|ts|tsx|md|json)$/.test(entry)) yield full;
  }
}

function collectURLs() {
  const urls = []; // [{ url, file, line }]
  for (const root of SCAN_DIRS) {
    for (const file of walk(root)) {
      const rel = path.relative(REPO_ROOT, file);
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((text, idx) => {
        const ms = text.match(URL_RE);
        if (!ms) return;
        for (const raw of ms) {
          const cleaned = cleanURL(raw);
          if (isTemplateURL(cleaned)) continue;
          urls.push({ url: cleaned, file: rel, line: idx + 1 });
        }
      });
    }
  }
  return urls;
}

async function probe(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    let resp = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "FloofLifeLinkAudit/1.0" } }).catch(() => null);
    // Some hosts (FDA among them) reject HEAD with 403/405. Fall back to a tiny GET.
    if (!resp || resp.status === 405 || resp.status === 403 || resp.status === 501) {
      resp = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "FloofLifeLinkAudit/1.0", Range: "bytes=0-1023" } });
    }
    return { ok: resp.ok, status: resp.status, finalUrl: resp.url };
  } catch (err) {
    return { ok: false, status: err?.name === "AbortError" ? "timeout" : (err?.code || "fetch-error"), error: err?.message };
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const all = collectURLs();
  // Dedupe by URL but keep the first file/line for the report.
  const seen = new Map();
  for (const item of all) if (!seen.has(item.url)) seen.set(item.url, item);
  const queue = [...seen.values()];
  console.log(`Auditing ${queue.length} unique URL${queue.length === 1 ? "" : "s"}…\n`);

  const dead = [];
  // Modest concurrency so we don't hammer FDA.
  const CONCURRENCY = 6;
  let i = 0;
  async function worker() {
    while (i < queue.length) {
      const my = queue[i++];
      const result = await probe(my.url);
      const ok = result.ok && (typeof result.status !== "number" || result.status < 400);
      const tag = ok ? "✓" : "✗";
      console.log(`  ${tag} ${result.status ?? "?"}  ${my.url}`);
      if (!ok) dead.push({ ...my, ...result });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\n${queue.length - dead.length} OK · ${dead.length} broken.`);
  if (dead.length) {
    fs.writeFileSync(REPORT_PATH, JSON.stringify(dead, null, 2));
    console.log(`Wrote ${path.relative(REPO_ROOT, REPORT_PATH)}.`);
    process.exit(1);
  } else if (fs.existsSync(REPORT_PATH)) {
    fs.unlinkSync(REPORT_PATH);
  }
}

run().catch((e) => { console.error(e); process.exit(2); });
