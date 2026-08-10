"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveReportAction } from "@/app/actions/admin-moderation";
import { Button } from "@/components/ui/button";

export function ReportActions({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(async () => { await resolveReportAction(reportId, "RESOLVED"); router.refresh(); })}
      >
        Mark resolved
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => startTransition(async () => { await resolveReportAction(reportId, "DISMISSED"); router.refresh(); })}
      >
        Dismiss
      </Button>
    </div>
  );
}
