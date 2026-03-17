export function CandidatosListSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* TypeBar skeleton */}
      <div className="flex gap-2 overflow-hidden py-1">
        {[88, 120, 130, 90, 136].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-full bg-muted animate-pulse flex-shrink-0"
            style={{ width: w }}
          />
        ))}
      </div>
      {/* Filter bar skeleton */}
      <div className="hidden lg:flex gap-2">
        <div className="h-9 w-60 rounded-lg bg-muted animate-pulse" />
        <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
      </div>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-muted animate-pulse overflow-hidden"
          >
            <div className="h-[3px] w-full bg-muted-foreground/10" />
            <div className="p-3.5 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-[60px] h-[60px] rounded-full bg-muted-foreground/10 flex-shrink-0" />
                <div className="flex-1 flex flex-col items-end gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-[34px] h-[34px] rounded-md bg-muted-foreground/10" />
                    <div className="w-[34px] h-[34px] rounded-md bg-muted-foreground/10" />
                  </div>
                  <div className="w-20 h-4 rounded-full bg-muted-foreground/10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-5 w-full rounded bg-muted-foreground/10" />
                <div className="h-5 w-3/4 rounded bg-muted-foreground/10" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-5 w-24 rounded-md bg-muted-foreground/10" />
                <div className="h-5 w-16 rounded-md bg-muted-foreground/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
