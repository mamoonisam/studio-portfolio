import Link from "next/link";
import { ArrowForward } from "@/components/icons";

interface Props {
  title: string;
  intro?: string | null;
  action?: { href: string; label: string };
  id?: string;
}

export function SectionHeading({ title, intro, action, id }: Props) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 md:mb-14">
      <div className="min-w-0 max-w-2xl">
        <h2 id={id} className="display-2">{title}</h2>
        {intro && <p className="lead mt-3 whitespace-pre-line">{intro}</p>}
      </div>
      {action && (
        <Link href={action.href} className="group inline-flex items-center gap-2 text-[0.95rem] font-medium text-ink hover:text-accent">
          {action.label}
          <ArrowForward size={18} className="transition-transform group-hover:-translate-x-1" />
        </Link>
      )}
    </div>
  );
}
