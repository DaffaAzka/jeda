function Bar({ className }: { className: string }) {
  return <div className={`bg-muted ${className}`} />;
}

export default function StudyLoading() {
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

        <div className="space-y-10">
          {Array.from({ length: 2 }, (_, sIdx) => (
            <div className="space-y-4" key={sIdx}>
              <Bar className="h-6 w-36 border-b-2 border-border" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, tIdx) => (
                  <div
                    className="border-2 border-border bg-card p-5 space-y-4"
                    key={tIdx}
                  >
                    <Bar className="h-5 w-3/4" />
                    <Bar className="h-3 w-1/3" />
                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <Bar className="h-3 w-24" />
                      <Bar className="h-6 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
