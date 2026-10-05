/**
 * Builds URL slugs that keep Arabic letters readable:
 * "حفل زفاف أحمد وسارة" → "حفل-زفاف-أحمد-وسارة"
 */
export function slugify(input: string, maxLength = 80): string {
  const slug = input
    .normalize("NFKC")
    .toLowerCase()
    // Arabic diacritics (tashkeel), superscript alef and tatweel
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "item";
}

/** Normalises a slug the admin typed by hand. */
export function cleanSlug(input: string): string {
  return slugify(input, 120);
}

/** Route params arrive URL-encoded for non-Latin slugs; decode safely. */
export function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Picks the first free slug: base, base-2, base-3, … */
export function nextFreeSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let i = 2; i < 10_000; i++) {
    const candidate = `${base}-${i}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
