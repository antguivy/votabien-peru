export function CandidatosListSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-muted animate-pulse overflow-hidden"
        >
          <div className="h-1.5 w-full bg-muted-foreground/10" />
          <div className="p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="w-14 h-14 rounded-full bg-muted-foreground/10" />
              <div className="flex flex-col items-end gap-1.5">
                <div className="w-9 h-9 rounded-lg bg-muted-foreground/10" />
                <div className="w-16 h-4 rounded-full bg-muted-foreground/10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-full rounded bg-muted-foreground/10" />
              <div className="h-4 w-2/3 rounded bg-muted-foreground/10" />
            </div>
            <div className="h-px bg-muted-foreground/10" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-1/2 rounded bg-muted-foreground/10" />
              <div className="w-7 h-7 rounded-full bg-muted-foreground/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
