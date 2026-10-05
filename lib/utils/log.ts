/**
 * Developer logging. Writes a compact, secret-free line to the server log
 * (Vercel → Logs). Never send these details to the browser.
 */
export function logError(scope: string, error: unknown, extra?: Record<string, unknown>): void {
  const info: Record<string, unknown> = { scope, ...extra };
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown; status?: unknown; name?: unknown };
    info.name = e.name;
    info.message = typeof e.message === "string" ? e.message.slice(0, 500) : undefined;
    info.code = e.code;
    info.status = e.status;
    info.details = typeof e.details === "string" ? e.details.slice(0, 300) : undefined;
    info.hint = e.hint;
  } else {
    info.message = String(error).slice(0, 500);
  }
  console.error("[app-error]", JSON.stringify(info));
}

/** True for a Postgres unique-violation error (e.g. duplicate slug). */
export function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { code?: string }).code === "23505");
}
