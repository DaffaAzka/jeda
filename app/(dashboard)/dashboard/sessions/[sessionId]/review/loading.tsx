function Bar({ className }: { className: string }) {
  return <div className={`bg-muted ${className}`} />;
}

export default function SessionReviewLoading() {
  return (
    <main
      aria-busy="true"
      className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12 animate-pulse"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header summary skeleton */}
        <div className="border-2 border-border bg-card p-6 sm:p-8 space-y-4">
          <div className="flex justify-between">
            <Bar className="h-4 w-28" />
            <Bar className="h-4 w-20" />
          </div>
          <Bar className="h-8 w-60" />
          <Bar className="h-10 w-44" />
          <div className="flex gap-2 pt-2">
            <Bar className="h-10 w-32 border-2 border-border bg-moodi-sky/30" />
            <Bar className="h-10 w-36 border-2 border-border" />
          </div>
        </div>

        {/* Question cards skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, idx) => (
            <div
              className="border-2 border-border bg-card p-6 sm:p-8 space-y-4"
              key={idx}
            >
              <div className="flex justify-between">
                <Bar className="h-5 w-20" />
                <Bar className="h-6 w-24" />
              </div>
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-3/4" />
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="border-2 border-border p-4 space-y-2">
                  <Bar className="h-3 w-20" />
                  <Bar className="h-4 w-full" />
                </div>
                <div className="border-2 border-border p-4 space-y-2">
                  <Bar className="h-3 w-20" />
                  <Bar className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
