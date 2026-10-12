export default function Loading() {
  return (
    <main className="min-w-0 flex-1 px-4 pb-24 py-8 sm:px-6 lg:px-10 lg:pb-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="mt-4 h-10 w-56 rounded bg-muted" />
        <div className="mt-3 h-4 w-80 rounded bg-muted" />

        {/* Stats row */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              className="border-2 border-border bg-card p-5"
              key={i}
            >
              <div className="h-10 w-10 rounded bg-muted" />
              <div className="mt-2 h-3 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-12 h-5 w-32 rounded bg-muted" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              className="border-2 border-border bg-card p-6"
              key={i}
            >
              <div className="h-12 w-12 rounded bg-muted" />
              <div className="mt-4 h-4 w-32 rounded bg-muted" />
              <div className="mt-2 h-3 w-full rounded bg-muted" />
              <div className="mt-1 h-3 w-4/5 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
