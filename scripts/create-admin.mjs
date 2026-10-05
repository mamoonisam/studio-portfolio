#!/usr/bin/env node
/**
 * Creates (or promotes) the site owner account.
 *
 *   npm run create-admin -- owner@example.com "a-strong-password"
 *   npm run create-admin            (asks for email and password)
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
 * Runs on your computer only; the secret key never reaches the website bundle.
 */
import { readFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout, argv, exit } from "node:process";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]]) continue;
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

loadEnv();

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("✗ ضع NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SECRET_KEY في ملف .env.local أولًا.");
  exit(1);
}

const headers = {
  apikey: secret,
  "Content-Type": "application/json",
  ...(secret.startsWith("eyJ") ? { Authorization: `Bearer ${secret}` } : {}),
};

async function ask() {
  let [email, password] = argv.slice(2);
  if (email && password) return { email, password };
  const rl = createInterface({ input: stdin, output: stdout });
  email = email || (await rl.question("البريد الإلكتروني للمدير: "));
  password = password || (await rl.question("كلمة المرور (12 حرفًا على الأقل): "));
  rl.close();
  return { email, password };
}

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers });
    if (!res.ok) throw new Error(`تعذر قراءة المستخدمين (${res.status})`);
    const body = await res.json();
    const users = body.users ?? [];
    const found = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < 200) return null;
  }
  return null;
}

async function main() {
  const { email: rawEmail, password } = await ask();
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("البريد الإلكتروني غير صالح.");
  if (!password || password.length < 12) throw new Error("كلمة المرور يجب أن تكون 12 حرفًا على الأقل.");

  let userId;
  const create = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (create.ok) {
    userId = (await create.json()).id;
    console.log("✓ تم إنشاء الحساب.");
  } else {
    const existing = await findUserByEmail(email);
    if (!existing) {
      const text = await create.text();
      throw new Error(`تعذر إنشاء الحساب (${create.status}): ${text.slice(0, 200)}`);
    }
    userId = existing.id;
    const upd = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ password, email_confirm: true }),
    });
    if (!upd.ok) throw new Error(`الحساب موجود لكن تعذر تحديث كلمة المرور (${upd.status}).`);
    console.log("✓ الحساب موجود مسبقًا — تم تحديث كلمة المرور.");
  }

  const promote = await fetch(`${url}/rest/v1/admin_users?on_conflict=user_id`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: userId, role: "owner" }),
  });
  if (!promote.ok) {
    const text = await promote.text();
    throw new Error(`تعذر منح صلاحية المدير (${promote.status}). هل نفّذت ملفات قاعدة البيانات؟ ${text.slice(0, 200)}`);
  }

  console.log(`✓ ${email} أصبح مديرًا للموقع. ادخل من /admin/login`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  exit(1);
});
