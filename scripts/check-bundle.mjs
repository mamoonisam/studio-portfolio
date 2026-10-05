#!/usr/bin/env node
/**
 * After `npm run build`: makes sure no secret ended up in the browser files.
 * Scans .next/static (everything the browser downloads).
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const root = ".next/static";
if (!existsSync(root)) {
  console.error("✗ شغّل npm run build أولًا.");
  process.exit(1);
}

const secrets = [process.env.SUPABASE_SECRET_KEY, process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.BOOKING_HASH_SALT].filter(
  (v) => typeof v === "string" && v.length >= 12,
);
const markers = ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY", "BOOKING_HASH_SALT"];
// supabase-js itself contains the literal prefix "sb_secret_" (it detects the key format),
// so look for an actual key value (prefix followed by the key body) instead of the bare prefix.
const keyPatterns = [/sb_secret_[A-Za-z0-9_-]{16,}/];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let problems = 0;
let files = 0;
for (const file of walk(root)) {
  if (!/\.(js|css|json|html|txt|map)$/.test(file)) continue;
  files++;
  const text = readFileSync(file, "utf8");
  for (const s of secrets) if (text.includes(s)) { console.error(`✗ secret value found in ${file}`); problems++; }
  for (const m of markers) if (text.includes(m)) { console.error(`✗ "${m}" found in ${file}`); problems++; }
  for (const re of keyPatterns) if (re.test(text)) { console.error(`✗ secret key pattern ${re} found in ${file}`); problems++; }
}

if (problems) process.exit(1);
console.log(`✓ No secrets in ${files} browser files.`);
