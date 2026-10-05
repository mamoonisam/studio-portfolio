export default function Loading() {
  return (
    <div className="container-x pb-20 pt-[calc(var(--header-h)+3.5rem)]" aria-busy="true">
      <div className="skeleton h-12 w-56" />
      <div className="skeleton mt-4 h-5 w-80 max-w-full" />
      <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/5] w-full" />
        ))}
      </div>
    </div>
  );
}
