import Link from "next/link";
import { ArrowForward } from "@/components/icons";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
      <ArrowForward size={16} className="rotate-180" />
      {label}
    </Link>
  );
}
