import Link from "next/link";
import { FileTextIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RecentResumesCardProps {
  resumes: {
    id: string;
    title: string;
    status: string;
    updatedAt: Date;
  }[];
}

function statusVariant(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "PUBLISHED" || normalized === "COMPLETE")
    return "success" as const;
  if (normalized === "ARCHIVED") return "outline" as const;
  return "secondary" as const;
}

function RecentResumesCard({ resumes }: RecentResumesCardProps) {
  return (
    <Card className="hover-glow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="from-chart-blue/20 to-chart-blue/5 text-chart-blue ring-chart-blue/15 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset">
            <FileTextIcon className="size-4.5" />
          </div>
          <CardTitle className="text-lg">Recent resumes</CardTitle>
        </div>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/resumes">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {resumes.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground text-sm">
              You haven&apos;t created a resume yet.
            </p>
            <Button asChild size="sm">
              <Link href="/dashboard/resumes">Create your first resume</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col divide-y">
            {resumes.map((resume) => (
              <li
                key={resume.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <Link
                  href={`/dashboard/resumes/${resume.id}`}
                  className="text-foreground text-sm font-medium hover:underline"
                >
                  {resume.title}
                </Link>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant(resume.status)} className="capitalize">
                    {resume.status.toLowerCase()}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {resume.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { RecentResumesCard };
