function Bar({ className }: { className: string }) {
  return <div className={`bg-muted ${className}`} />;
}

export default function SessionRunnerLoading() {
  return (
    <div
      aria-busy="true"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background animate-pulse"
    >
      {/* Top bar skeleton */}
      <div className="flex min-h-16 items-center justify-between border-b-2 border-border bg-card px-4 sm:px-6">
        <Bar className="h-8 w-32 border border-border" />
        <div className="flex items-center gap-3">
          <Bar className="h-4 w-20" />
          <Bar className="h-9 w-24 border border-border" />
        </div>
        <Bar className="h-8 w-24 border border-border" />
      </div>

      {/* Main body skeleton */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-8 p-4 sm:p-6 lg:p-8">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="border-2 border-border bg-card p-6 sm:p-8 space-y-4">
            <Bar className="h-5 w-24" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-4/5" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, idx) => (
              <div
                className="flex min-h-14 items-center gap-4 border-2 border-border bg-card p-4"
                key={idx}
              >
                <Bar className="size-8 border-2 border-border" />
                <Bar className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar navigator skeleton */}
        <div className="hidden w-64 shrink-0 border-2 border-border bg-card p-4 lg:block space-y-4">
          <Bar className="h-5 w-32" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }, (_, idx) => (
              <Bar className="size-10 border-2 border-border" key={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
