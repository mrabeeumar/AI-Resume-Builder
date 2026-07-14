import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobWorkspaceLoading() {
  return (
    <main className="flex flex-1 justify-center py-10 sm:py-16">
      <Container className="max-w-5xl flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </Container>
    </main>
  );
}
