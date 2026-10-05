import type { Metadata } from "next";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t.admin.brand,
  robots: { index: false, follow: false, nocache: true },
};

// Admin pages always read fresh data and the visitor's session.
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
