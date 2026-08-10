import type { Metadata } from "next";
import { Flag } from "lucide-react";
import { getReports } from "@/lib/data/admin";
import { ReportActions } from "@/components/admin/report-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Reports — E-Learning admin" };

export default async function AdminReportsPage() {
  const reports = await getReports("PENDING");

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Pending reports</h2>
      {reports.length === 0 ? (
        <EmptyState icon={Flag} title="No pending reports" description="Reports filed by users about courses, reviews, or other users show up here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li key={report.id} className="rounded-xl border border-border p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary">{report.targetType}</Badge>
                <p className="text-xs text-muted-foreground">Reported by {report.reporter.name}</p>
              </div>
              <p className="mb-1 text-sm text-foreground">{report.reason}</p>
              {report.course && <p className="text-xs text-muted-foreground">Course: {report.course.title}</p>}
              {report.review && (
                <p className="text-xs text-muted-foreground">
                  Review by {report.review.user.name}: &ldquo;{report.review.comment}&rdquo;
                </p>
              )}
              <div className="mt-3">
                <ReportActions reportId={report.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
