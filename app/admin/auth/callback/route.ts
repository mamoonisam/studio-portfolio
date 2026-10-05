import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { logError } from "@/lib/utils/log";

/**
 * Landing point of the password-reset email. Supabase sends either a PKCE
 * `code` (default) or a `token_hash` (custom email templates). Both are turned
 * into a short recovery session, then the visitor chooses a new password.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fail = NextResponse.redirect(new URL("/admin/forgot?error=link", request.url));
  if (!isSupabaseConfigured()) return fail;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  try {
    const supabase = await getServerSupabase();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        logError("recovery:callback:code", error);
        return fail;
      }
    } else if (tokenHash && type === "recovery") {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) {
        logError("recovery:callback:otp", error);
        return fail;
      }
    } else {
      return fail;
    }
  } catch (error) {
    logError("recovery:callback", error);
    return fail;
  }

  return NextResponse.redirect(new URL("/admin/reset", request.url));
}
