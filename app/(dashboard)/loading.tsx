export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse p-6">
      <div className="h-8 bg-muted rounded w-48" />
      <div className="h-4 bg-muted rounded w-64 opacity-60" />
      <div className="h-[400px] bg-muted rounded-xl mt-6" />
    </div>
  );
}
