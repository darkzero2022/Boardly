export default function ReportsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-40" />
      <div className="h-4 bg-muted rounded w-72 opacity-60" />
      <div className="flex gap-1 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-36 bg-muted rounded-md" />
        ))}
      </div>
      <div className="h-[320px] bg-muted rounded-xl" />
    </div>
  );
}
