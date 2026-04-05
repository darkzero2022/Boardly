import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Team workload, SLA compliance, and burndown charts
        </p>
      </div>
      <ReportsDashboard />
    </div>
  );
}
