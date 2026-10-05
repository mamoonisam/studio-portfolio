import { ar } from "./ar";

/**
 * Locale configuration. Arabic is the default and only locale today.
 * Adding English later: create en.ts with the same keys, add it here, and
 * add a [locale] route segment (see README → "إضافة اللغة الإنجليزية").
 */
export const locales = {
  ar: { dict: ar, dir: "rtl" as const, htmlLang: "ar", dateLocale: "ar-IQ-u-nu-latn", numberLocale: "en-US" },
};

export type Locale = keyof typeof locales;
export const defaultLocale: Locale = "ar";

export const localeConfig = locales[defaultLocale];
export const t = localeConfig.dict;
