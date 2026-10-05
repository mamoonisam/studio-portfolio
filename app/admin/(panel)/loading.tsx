export default function AdminLoading() {
  return (
    <div aria-busy="true" className="grid gap-4">
      <div className="skeleton h-9 w-48" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div className="skeleton h-64" />
    </div>
  );
}
