import type { Metadata } from "next";
import Link from "next/link";
import { Users, GraduationCap, BookOpen, CheckCircle2, Award, AlertTriangle, Flag } from "lucide-react";
import { getPlatformStats } from "@/lib/data/admin";
import { StatTile } from "@/components/dashboard/stat-tile";

export const metadata: Metadata = { title: "Admin overview — E-Learning" };

export default async function AdminOverviewPage() {
  const stats = await getPlatformStats();

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile icon={Users} label="Total users" value={stats.totalUsers} />
        <StatTile icon={GraduationCap} label="Instructors" value={stats.totalInstructors} />
        <StatTile icon={BookOpen} label="Courses" value={stats.totalCourses} />
        <StatTile icon={CheckCircle2} label="Published courses" value={stats.publishedCourses} />
        <StatTile icon={Users} label="Total enrollments" value={stats.totalEnrollments} />
        <StatTile icon={Award} label="Certificates issued" value={stats.totalCertificates} />
      </div>

      {(stats.pendingModeration > 0 || stats.pendingReports > 0) && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Needs attention</h2>
          {stats.pendingModeration > 0 && (
            <Link
              href="/admin/courses?moderationStatus=PENDING"
              className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm hover:bg-warning/10"
            >
              <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden="true" />
              <span className="flex-1 text-foreground">{stats.pendingModeration} course(s) awaiting moderation</span>
            </Link>
          )}
          {stats.pendingReports > 0 && (
            <Link href="/admin/reports" className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm hover:bg-warning/10">
              <Flag className="size-5 shrink-0 text-warning" aria-hidden="true" />
              <span className="flex-1 text-foreground">{stats.pendingReports} report(s) pending review</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
