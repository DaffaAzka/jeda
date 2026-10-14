function Bar({ className }: { className: string }) {
  return <div className={`bg-muted ${className}`} />;
}

export default function MockExamLoading() {
  return (
    <main
      aria-busy="true"
      className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12 animate-pulse"
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <Bar className="h-8 w-44" />
          <Bar className="h-4 w-72" />
        </div>

        {/* Builder card skeleton */}
        <div className="border-2 border-border bg-card p-6 sm:p-8 space-y-6">
          <Bar className="h-6 w-40" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, idx) => (
              <div
                className="border-2 border-border bg-background p-4 space-y-3"
                key={idx}
              >
                <Bar className="h-5 w-3/4" />
                <div className="flex justify-between pt-2">
                  <Bar className="h-3 w-16" />
                  <Bar className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <Bar className="h-4 w-32" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, idx) => (
                <div className="border-2 border-border p-4 space-y-2" key={idx}>
                  <Bar className="h-4 w-20" />
                  <Bar className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>

          <Bar className="h-12 w-40 border-2 border-border bg-moodi-sky/40" />
        </div>

        {/* Recent sessions skeleton */}
        <div className="space-y-4">
          <Bar className="h-6 w-36" />
          <div className="space-y-3">
            {Array.from({ length: 2 }, (_, idx) => (
              <div
                className="flex items-center justify-between border-2 border-border bg-card p-4"
                key={idx}
              >
                <div className="space-y-2">
                  <Bar className="h-4 w-32" />
                  <Bar className="h-3 w-24" />
                </div>
                <Bar className="h-9 w-28 border-2 border-border" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
