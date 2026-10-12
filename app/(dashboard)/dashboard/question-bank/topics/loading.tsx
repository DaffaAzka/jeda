export default function Loading() {
  return (
    <main className="min-w-0 flex-1 px-4 pb-24 py-8 sm:px-6 lg:px-10 lg:pb-8">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="mt-4 h-10 w-32 rounded bg-muted" />
        <div className="mt-2 h-3 w-72 rounded bg-muted" />

        <div className="mt-8 flex items-center justify-between">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-9 w-28 rounded bg-muted" />
        </div>

        <div className="mt-3 border-2 border-border">
          <div className="border-b-2 border-border bg-muted p-3">
            <div className="flex gap-8">
              <div className="h-3 w-20 rounded bg-muted-foreground/20" />
              <div className="h-3 w-32 rounded bg-muted-foreground/20" />
              <div className="ml-auto h-3 w-10 rounded bg-muted-foreground/20" />
              <div className="h-3 w-16 rounded bg-muted-foreground/20" />
            </div>
          </div>
          {[...Array(6)].map((_, i) => (
            <div
              className="border-b-2 border-border bg-card px-4 py-3 last:border-0"
              key={i}
            >
              <div className="flex items-center gap-8">
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-3 w-40 rounded bg-muted" />
                <div className="ml-auto h-3 w-6 rounded bg-muted" />
                <div className="flex gap-2">
                  <div className="h-7 w-12 rounded bg-muted" />
                  <div className="h-7 w-12 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
