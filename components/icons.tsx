import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p: IconProps) => <Base {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Base>;
export const CloseIcon = (p: IconProps) => <Base {...p}><path d="M6 6l12 12M18 6L6 18" /></Base>;
/** Points to the reading direction's "forward" in RTL (left). */
export const ChevronForward = (p: IconProps) => <Base {...p}><path d="M15 5l-7 7 7 7" /></Base>;
export const ChevronBack = (p: IconProps) => <Base {...p}><path d="M9 5l7 7-7 7" /></Base>;
export const ChevronUp = (p: IconProps) => <Base {...p}><path d="M6 15l6-6 6 6" /></Base>;
export const ChevronDown = (p: IconProps) => <Base {...p}><path d="M6 9l6 6 6-6" /></Base>;
export const ArrowForward = (p: IconProps) => <Base {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Base>;
export const PhoneIcon = (p: IconProps) => (
  <Base {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" /></Base>
);
export const MailIcon = (p: IconProps) => <Base {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Base>;
export const PinIcon = (p: IconProps) => <Base {...p}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Base>;
export const ClockIcon = (p: IconProps) => <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Base>;
export const CheckIcon = (p: IconProps) => <Base {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Base>;
export const PlusIcon = (p: IconProps) => <Base {...p}><path d="M12 5v14M5 12h14" /></Base>;
export const TrashIcon = (p: IconProps) => <Base {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Base>;
export const EditIcon = (p: IconProps) => <Base {...p}><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z" /></Base>;
export const ImageIcon = (p: IconProps) => <Base {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></Base>;
export const UploadIcon = (p: IconProps) => <Base {...p}><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></Base>;
export const ExternalIcon = (p: IconProps) => <Base {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></Base>;
export const LogoutIcon = (p: IconProps) => <Base {...p}><path d="M10 4H5a1 1 0 00-1 1v14a1 1 0 001 1h5M15 8l-4 4 4 4M11 12h10" /></Base>;
export const HomeIcon = (p: IconProps) => <Base {...p}><path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1z" /></Base>;
export const AlbumIcon = (p: IconProps) => <Base {...p}><rect x="6" y="6" width="14" height="14" rx="2" /><path d="M4 16V5a1 1 0 011-1h11" /></Base>;
export const TagIcon = (p: IconProps) => <Base {...p}><path d="M3 12V4a1 1 0 011-1h8l9 9-9 9z" /><circle cx="8" cy="8" r="1.5" /></Base>;
export const BriefcaseIcon = (p: IconProps) => <Base {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18" /></Base>;
export const BoxIcon = (p: IconProps) => <Base {...p}><path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10" /></Base>;
export const CalendarIcon = (p: IconProps) => <Base {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Base>;
export const SettingsIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></Base>
);
export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Base {...p} fill={filled ? "currentColor" : "none"}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" /></Base>
);
export const EyeIcon = (p: IconProps) => <Base {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Base>;
export const EyeOffIcon = (p: IconProps) => <Base {...p}><path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3 3.9M6.6 6.6A17 17 0 002 12s3.6 7 10 7a9.6 9.6 0 004.4-1.1M9.9 9.9a3 3 0 004.2 4.2" /></Base>;
export const CopyIcon = (p: IconProps) => <Base {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></Base>;
export const AlertIcon = (p: IconProps) => <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></Base>;
export const SpinnerIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`animate-spin ${className ?? ""}`}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 00-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/* Brand marks — simplified single-colour glyphs */
export const WhatsAppIcon = ({ size = 20, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...p}>
    <path d="M12.04 2a9.9 9.9 0 00-8.5 14.98L2 22l5.16-1.5A9.9 9.9 0 1012.04 2zm0 18.1a8.2 8.2 0 01-4.2-1.15l-.3-.18-3.06.9.9-2.98-.2-.31a8.2 8.2 0 1116.86-4.38 8.2 8.2 0 01-10 8.1zm4.5-6.13c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06a6.7 6.7 0 01-1.98-1.22 7.4 7.4 0 01-1.37-1.7c-.14-.25 0-.38.11-.5.11-.12.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42h-.48a.92.92 0 00-.66.31 2.78 2.78 0 00-.87 2.07 4.83 4.83 0 001.01 2.56 11 11 0 004.23 3.74c.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.29z" />
  </svg>
);
export const InstagramIcon = (p: IconProps) => <Base {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></Base>;
export const FacebookIcon = (p: IconProps) => <Base {...p}><path d="M14 8h3V4h-3a4 4 0 00-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8a0 0 0 010 0z" /></Base>;
export const TikTokIcon = (p: IconProps) => <Base {...p}><path d="M14 3v11.5a3.5 3.5 0 11-3.5-3.5M14 3a5 5 0 005 5" /></Base>;
export const YouTubeIcon = (p: IconProps) => <Base {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" /></Base>;
