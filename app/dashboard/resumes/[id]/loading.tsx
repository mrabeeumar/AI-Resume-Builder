import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResumeDetailLoading() {
  return (
    <main className="flex flex-1 justify-center py-8 sm:py-10">
      <Container className="flex max-w-[96rem] flex-col gap-6">
        <Skeleton className="h-8 w-40" />

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-8 w-56" />
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-7 w-24 shrink-0 rounded-full"
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_minmax(0,26rem)]">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-[36rem] rounded-xl" />
          <Skeleton className="h-[36rem] rounded-xl lg:col-span-2 xl:col-span-1" />
        </div>
      </Container>
    </main>
  );
}
