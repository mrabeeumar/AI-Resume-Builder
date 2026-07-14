import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoverLetterDetailLoading() {
  return (
    <main className="flex flex-1 justify-center py-8 sm:py-10">
      <Container className="flex max-w-6xl flex-col gap-6">
        <Skeleton className="h-8 w-48" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-56" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-[32rem] rounded-xl" />
          </div>
          <Skeleton className="h-[28rem] rounded-xl" />
        </div>
      </Container>
    </main>
  );
}
