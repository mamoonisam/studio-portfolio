import { WhatsAppIcon } from "@/components/icons";
import { t } from "@/lib/i18n";
import { whatsappLink } from "@/lib/utils/contact";

/** Floating WhatsApp button. Hidden when no number is set in settings. */
export function WhatsAppFloat({ number }: { number: string }) {
  const href = whatsappLink(number, t.whatsapp.greeting);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsapp.float}
      title={t.whatsapp.float}
      className="fixed z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f9d55] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-transform hover:scale-105 focus-visible:scale-105"
      style={{
        insetInlineStart: "max(1rem, env(safe-area-inset-left, 0px))",
        bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
