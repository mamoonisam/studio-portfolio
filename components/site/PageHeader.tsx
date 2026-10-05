/** Title block for inner pages; leaves room for the fixed header. */
export function PageHeader({ title, intro, eyebrow }: { title: string; intro?: string | null; eyebrow?: string }) {
  return (
    <div className="container-x pb-10 pt-[calc(var(--header-h)+3.5rem)] md:pb-14 md:pt-[calc(var(--header-h)+5rem)]">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="display-2 fade-up">{title}</h1>
      {intro && <p className="lead fade-up fade-up-2 mt-4 whitespace-pre-line">{intro}</p>}
    </div>
  );
}
