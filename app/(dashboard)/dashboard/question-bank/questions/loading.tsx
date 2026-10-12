export default function Loading() {
  return (
    <main className="min-w-0 flex-1 px-4 pb-24 py-8 sm:px-6 lg:px-10 lg:pb-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="h-10 w-44 rounded bg-muted" />
            <div className="mt-2 h-3 w-72 rounded bg-muted" />
          </div>
          <div className="h-11 w-36 rounded bg-muted" />
        </div>

        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              className="border-2 border-border bg-card p-4"
              key={i}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-4 w-full max-w-sm rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-14 rounded bg-muted" />
                  <div className="h-9 w-14 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
