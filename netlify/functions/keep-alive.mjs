/**
 * Keeps the Supabase free-tier project awake.
 *
 * Supabase pauses free projects after about a week without activity, which
 * would leave the site without content. This Netlify Scheduled Function runs
 * once a day and makes one tiny read from the database (the public settings
 * row), which counts as activity. It uses only the public (publishable) key,
 * so it can read nothing that a normal visitor could not.
 *
 * Runs on Netlify's free plan. Logs: Netlify → Logs → Functions → keep-alive.
 */
async function keepAlive() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[keep-alive] Supabase URL or publishable key is missing.");
    return new Response("not configured", { status: 500 });
  }

  try {
    const res = await fetch(`${url}/rest/v1/site_settings?select=id&limit=1`, {
      headers: { apikey: key, Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error(`[keep-alive] Supabase answered ${res.status}.`);
      return new Response("supabase error", { status: 502 });
    }
    console.log("[keep-alive] Supabase is awake.");
    return new Response("ok");
  } catch (error) {
    console.error("[keep-alive] Request failed:", error instanceof Error ? error.message : String(error));
    return new Response("request failed", { status: 502 });
  }
}

export default keepAlive;

// Every day at 03:00 UTC (06:00 Baghdad).
export const config = {
  schedule: "0 3 * * *",
};
