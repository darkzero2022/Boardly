export default function UsersSettingsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-48" />
      <div className="h-4 bg-muted rounded w-80 opacity-60" />
      <div className="flex items-center justify-between mt-4">
        <div className="h-9 bg-muted rounded w-64" />
        <div className="h-9 bg-muted rounded w-28" />
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="h-11 bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-t border-border">
            <div className="w-8 h-8 bg-muted rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-48 opacity-60" />
            </div>
            <div className="h-7 bg-muted rounded w-24" />
            <div className="h-7 bg-muted rounded w-28" />
            <div className="h-4 bg-muted rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
