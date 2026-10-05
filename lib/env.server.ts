import "server-only";

/**
 * Server-only secrets. Importing this file from a Client Component fails the
 * build (thanks to "server-only"), so these values can never reach the browser.
 */

export function getSecretKey(): string | null {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export function getBookingSalt(): string {
  return process.env.BOOKING_HASH_SALT || getSecretKey() || "booking-salt-not-configured";
}

export function getBookingMaxPerHour(): number {
  const n = Number(process.env.BOOKING_MAX_PER_HOUR);
  return Number.isFinite(n) && n >= 1 && n <= 100 ? Math.floor(n) : 5;
}
