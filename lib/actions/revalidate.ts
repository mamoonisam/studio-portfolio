import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Public pages are cached and regenerated (ISR). After any admin change we
 * clear the whole site cache so the update is visible immediately — no
 * redeploy needed.
 */
export function revalidateSite(): void {
  revalidatePath("/", "layout");
}
