/** Fallbacks for the Suspense boundaries on the question bank pages. They match
 *  the final layout so content swaps in without a jump. */

function Bar({ className }: { className: string }) {
  return <div className={`bg-muted ${className}`} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true" className="animate-pulse">
      <div className="flex items-center justify-between">
        <Bar className="h-3 w-20" />
        <Bar className="h-9 w-32 border-2 border-border" />
      </div>
      <div className="mt-3 border-2 border-border">
        <div className="border-b-2 border-border bg-muted px-4 py-3">
          <Bar className="h-3 w-1/3 bg-card" />
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div
            className="flex items-center gap-6 border-b-2 border-border bg-card px-4 py-3 last:border-b-0"
            key={index}
          >
            <Bar className="h-3 w-16" />
            <Bar className="h-3 flex-1" />
            <Bar className="h-7 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" className="mt-6 animate-pulse space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div className="border-2 border-border bg-card p-4" key={index}>
          <Bar className="h-3 w-40" />
          <Bar className="mt-2 h-4 w-full max-w-md" />
          <Bar className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse space-y-5">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="space-y-2" key={index}>
          <Bar className="h-3 w-28" />
          <Bar className="h-11 w-full border-2 border-border" />
        </div>
      ))}
      <Bar className="h-40 w-full border-2 border-border" />
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" className="grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div className="border-2 border-border bg-card p-5" key={index}>
          <Bar className="h-10 w-10" />
          <Bar className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
