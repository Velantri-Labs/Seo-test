#!/usr/bin/env node
// Replace the placeholder domain in every SEO-relevant file with your real one.
// Usage: node scripts/set-domain.mjs https://your-project.vercel.app
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "scripts", "site.json");
const current = JSON.parse(fs.readFileSync(configPath, "utf8")).url.replace(/\/$/, "");
const next = (process.argv[2] || "").replace(/\/$/, "");

if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(next)) {
  console.error("Usage: node scripts/set-domain.mjs https://your-domain.com  (https, no path)");
  process.exit(1);
}
if (next === current) { console.log(`Already set to ${current}`); process.exit(0); }

const exts = new Set([".html", ".xml", ".txt", ".json", ".webmanifest"]);
const skip = new Set([".git", "node_modules", ".vercel"]);
let changed = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!exts.has(path.extname(e.name)) || p === configPath) continue;
    const src = fs.readFileSync(p, "utf8");
    if (!src.includes(current)) continue;
    fs.writeFileSync(p, src.split(current).join(next));
    changed++;
    console.log("updated", path.relative(root, p));
  }
})(root);
fs.writeFileSync(configPath, JSON.stringify({ url: next }, null, 2) + "\n");
console.log(`\n${changed} files: ${current} -> ${next}`);
