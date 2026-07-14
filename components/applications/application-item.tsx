"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseIcon, MapPinIcon } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/applications/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { JobApplicationListItem } from "@/types/job-application";

export function ApplicationItem({
  application,
}: {
  application: JobApplicationListItem;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => null);
        toast.error(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      toast.success("Application deleted.");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <li>
      <Card className="hover-glow gap-3 p-5">
        <Link href={`/dashboard/applications/${application.id}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-foreground font-heading font-semibold">
                {application.position}
              </span>
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                <BriefcaseIcon className="size-3.5" />
                {application.company}
              </span>
              {application.location && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <MapPinIcon className="size-3.5" />
                  {application.location}
                </span>
              )}
            </div>
            <StatusBadge status={application.status} />
          </div>
        </Link>

        <div className="border-border flex items-center justify-end border-t pt-3">
          <ConfirmDialog
            trigger={
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            }
            title={`Delete application for "${application.position}"?`}
            description="This cannot be undone."
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={handleDelete}
          />
        </div>
      </Card>
    </li>
  );
}
