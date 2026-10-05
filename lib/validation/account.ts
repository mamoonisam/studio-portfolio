import { z } from "zod";
import { t } from "@/lib/i18n";

const a = t.admin.account;

/** Supabase Auth hashes with bcrypt, which only uses the first 72 bytes. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const newPasswordSchema = z
  .object({
    password: z.string().min(PASSWORD_MIN, a.tooShort).max(PASSWORD_MAX, a.tooLong),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: a.mismatch, path: ["confirm"] });

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, t.admin.common.required).max(200),
    password: z.string().min(PASSWORD_MIN, a.tooShort).max(PASSWORD_MAX, a.tooLong),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: a.mismatch, path: ["confirm"] });

export const setAdminPasswordSchema = z
  .object({
    user_id: z.uuid(),
    password: z.string().min(PASSWORD_MIN, a.tooShort).max(PASSWORD_MAX, a.tooLong),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: a.mismatch, path: ["confirm"] });

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email()).pipe(z.string().max(200));
