"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFeedback } from "@/components/admin/Feedback";
import { AdminPageHeader, SaveBar, SubmitButton, TextArea, TextField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/ImageField";
import { saveSettings } from "@/lib/actions/settings";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { Accent, SiteSettings, Theme } from "@/types/content";

const s = t.admin.settings;

type TabKey = keyof typeof s.tabs;

/** Which settings fields each tab saves. */
const TAB_FIELDS: Record<TabKey, (keyof SiteSettings)[]> = {
  general: ["photographer_name", "studio_name", "logo_path", "favicon_path", "hero_image_path", "hero_title", "hero_subtitle", "hero_primary_label", "hero_secondary_label"],
  home: ["featured_title", "featured_intro", "services_title", "services_intro", "packages_title", "packages_intro", "portfolio_intro", "cta_title", "cta_text", "cta_button_label", "booking_intro", "booking_success", "contact_intro", "footer_note"],
  about: ["about_image_path", "about_title", "about_short", "about_text", "about_story", "about_extra", "years_experience"],
  contact: ["phone", "whatsapp", "phone_country_code", "email", "address", "map_url", "working_hours"],
  social: ["instagram_url", "facebook_url", "tiktok_url", "youtube_url"],
  seo: ["seo_title", "seo_description", "og_image_path"],
  appearance: ["theme", "accent"],
};

const ACCENT_SWATCH: Record<Accent, string> = { brass: "#8c6d43", sage: "#56705a", slate: "#44596e", rose: "#93524e" };

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const { report } = useFeedback();
  const [tab, setTab] = useState<TabKey>("general");
  const [form, setForm] = useState<SiteSettings>(settings);
  const [source, setSource] = useState(settings);
  // After a save, the server's cleaned-up values replace the form (the open tab stays).
  if (source !== settings) {
    setSource(settings);
    setForm(settings);
  }
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const text = (key: keyof SiteSettings) => String(form[key] ?? "");
  const set = (key: keyof SiteSettings, value: unknown) => setForm((f) => ({ ...f, [key]: value }));
  const field = (key: keyof SiteSettings) => ({ value: text(key), onValue: (v: string) => set(key, v), error: errors[key] });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = Object.fromEntries(TAB_FIELDS[tab].map((k) => [k, form[k]]));
    startTransition(async () => {
      const result = await saveSettings(payload);
      if (report(result)) {
        setErrors({});
        router.refresh();
      } else if (!result.ok) setErrors(result.fieldErrors ?? {});
    });
  };

  const tabs = Object.keys(s.tabs) as TabKey[];

  return (
    <form onSubmit={submit} noValidate>
      <AdminPageHeader title={s.title} />

      <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label={s.title} className="flex w-max gap-1 rounded-full border border-line bg-surface p-1">
          {tabs.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={tab === key}
              aria-controls={`panel-${key}`}
              onClick={() => {
                setTab(key);
                setErrors({});
              }}
              className={cn("rounded-full px-4 py-2 text-[0.9rem] transition-colors", tab === key ? "bg-ink text-bg" : "text-muted hover:text-ink")}
            >
              {s.tabs[key]}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="grid max-w-2xl gap-6">
        {tab === "general" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={s.photographerName} {...field("photographer_name")} maxLength={120} />
              <TextField label={s.studioName} {...field("studio_name")} maxLength={120} />
            </div>
            <ImageField label={s.logo} hint={s.logoHint} value={form.logo_path} onChange={(p) => set("logo_path", p)} folder="site" optimize={false} aspect="3 / 1" contain />
            <ImageField label={s.heroImage} value={form.hero_image_path} onChange={(p) => set("hero_image_path", p)} folder="site" aspect="16 / 9" />
            <TextField label={s.heroTitle} {...field("hero_title")} maxLength={160} />
            <TextArea label={s.heroSubtitle} {...field("hero_subtitle")} rows={2} maxLength={400} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={s.heroPrimary} {...field("hero_primary_label")} maxLength={40} placeholder="شاهد أعمالنا" />
              <TextField label={s.heroSecondary} {...field("hero_secondary_label")} maxLength={40} placeholder="احجز جلستك" />
            </div>
            <ImageField label={s.favicon} hint={s.faviconHint} value={form.favicon_path} onChange={(p) => set("favicon_path", p)} folder="site" optimize={false} aspect="1 / 1" contain />
          </>
        )}

        {tab === "home" && (
          <>
            <TextField label={s.featuredTitle} {...field("featured_title")} maxLength={120} />
            <TextArea label={s.featuredIntro} {...field("featured_intro")} rows={2} maxLength={400} />
            <TextField label={s.servicesTitle} {...field("services_title")} maxLength={120} />
            <TextArea label={s.servicesIntro} {...field("services_intro")} rows={2} maxLength={400} />
            <TextField label={s.packagesTitle} {...field("packages_title")} maxLength={120} />
            <TextArea label={s.packagesIntro} {...field("packages_intro")} rows={2} maxLength={400} />
            <TextArea label={s.portfolioIntro} {...field("portfolio_intro")} rows={2} maxLength={400} />
            <TextField label={s.ctaTitle} {...field("cta_title")} maxLength={160} />
            <TextArea label={s.ctaText} {...field("cta_text")} rows={2} maxLength={400} />
            <TextField label={s.ctaButton} {...field("cta_button_label")} maxLength={40} />
            <TextArea label={s.bookingIntro} {...field("booking_intro")} rows={2} maxLength={600} />
            <TextArea label={s.bookingSuccess} {...field("booking_success")} rows={2} maxLength={400} />
            <TextArea label={s.contactIntro} {...field("contact_intro")} rows={2} maxLength={600} />
            <TextField label={s.footerNote} {...field("footer_note")} maxLength={300} />
          </>
        )}

        {tab === "about" && (
          <>
            <ImageField label={s.aboutImage} value={form.about_image_path} onChange={(p) => set("about_image_path", p)} folder="site" aspect="4 / 5" />
            <TextField label={s.aboutTitle} {...field("about_title")} maxLength={120} />
            <TextArea label={s.aboutShort} {...field("about_short")} rows={3} maxLength={800} />
            <TextArea label={s.aboutText} {...field("about_text")} rows={6} maxLength={5000} />
            <TextArea label={s.aboutStory} {...field("about_story")} rows={6} maxLength={5000} optional />
            <TextArea label={s.aboutExtra} {...field("about_extra")} rows={4} maxLength={3000} optional />
            <TextField
              label={s.years}
              value={form.years_experience === null || form.years_experience === undefined ? "" : String(form.years_experience)}
              onValue={(v) => set("years_experience", v)}
              error={errors.years_experience}
              inputMode="numeric"
              dir="ltr"
              maxLength={2}
              optional
            />
          </>
        )}

        {tab === "contact" && (
          <>
            <TextField label={s.phone} {...field("phone")} type="tel" inputMode="tel" dir="ltr" maxLength={30} />
            <TextField label={s.whatsapp} hint={s.whatsappHint} {...field("whatsapp")} type="tel" inputMode="tel" dir="ltr" maxLength={30} />
            <TextField label={s.countryCode} hint={s.countryCodeHint} {...field("phone_country_code")} inputMode="numeric" dir="ltr" maxLength={6} />
            <TextField label={s.email} {...field("email")} type="email" inputMode="email" dir="ltr" maxLength={200} />
            <TextArea label={s.address} {...field("address")} rows={2} maxLength={300} />
            <TextField label={s.mapUrl} hint={s.mapHint} {...field("map_url")} type="url" dir="ltr" maxLength={500} placeholder="https://maps.google.com/..." />
            <TextField label={s.hours} {...field("working_hours")} maxLength={200} />
          </>
        )}

        {tab === "social" && (
          <>
            <p className="field-hint">{s.socialHint}</p>
            <TextField label={s.instagram} {...field("instagram_url")} type="url" dir="ltr" placeholder="https://instagram.com/..." />
            <TextField label={s.facebook} {...field("facebook_url")} type="url" dir="ltr" placeholder="https://facebook.com/..." />
            <TextField label={s.tiktok} {...field("tiktok_url")} type="url" dir="ltr" placeholder="https://tiktok.com/@..." />
            <TextField label={s.youtube} {...field("youtube_url")} type="url" dir="ltr" placeholder="https://youtube.com/..." />
          </>
        )}

        {tab === "seo" && (
          <>
            <TextField label={s.seoTitle} {...field("seo_title")} maxLength={120} />
            <TextArea label={s.seoDescription} hint={s.seoDescriptionHint} {...field("seo_description")} rows={3} maxLength={300} />
            <ImageField label={s.ogImage} hint={s.ogImageHint} value={form.og_image_path} onChange={(p) => set("og_image_path", p)} folder="site" aspect="1200 / 630" />
          </>
        )}

        {tab === "appearance" && (
          <>
            <fieldset>
              <legend className="field-label mb-3">{s.theme}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["light", "dark", "system"] as Theme[]).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                      form.theme === value ? "border-ink" : "border-line",
                    )}
                  >
                    <input type="radio" name="theme" className="h-4 w-4 accent-[var(--accent)]" checked={form.theme === value} onChange={() => set("theme", value)} />
                    {value === "light" ? s.themeLight : value === "dark" ? s.themeDark : s.themeSystem}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="field-label mb-3">{s.accent}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(ACCENT_SWATCH) as Accent[]).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                      form.accent === value ? "border-ink" : "border-line",
                    )}
                  >
                    <input type="radio" name="accent" className="sr-only" checked={form.accent === value} onChange={() => set("accent", value)} />
                    <span className="h-6 w-6 shrink-0 rounded-full" style={{ background: ACCENT_SWATCH[value] }} aria-hidden="true" />
                    {s.accents[value]}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
      </div>

      <SaveBar>
        <SubmitButton pending={pending} />
      </SaveBar>
    </form>
  );
}
