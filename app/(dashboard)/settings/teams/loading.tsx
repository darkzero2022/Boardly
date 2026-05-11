export default function TeamsSettingsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-40" />
      <div className="h-4 bg-muted rounded w-64 opacity-60" />
      <div className="flex items-center justify-between mt-4">
        <div className="h-9 bg-muted rounded w-64" />
        <div className="h-9 bg-muted rounded w-28" />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="h-5 bg-muted rounded w-32" />
            <div className="h-4 bg-muted rounded w-20 opacity-60" />
            <div className="h-4 bg-muted rounded w-24 opacity-60" />
          </div>
        ))}
      </div>
    </div>
  );
}
