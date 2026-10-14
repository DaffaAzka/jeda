export default function CalmLoading() {
  return (
    <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12 animate-pulse">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-24 border-2 border-border bg-muted/60" />
        <div className="h-12 border-2 border-border bg-muted/40" />
        <div className="h-96 border-2 border-border bg-muted/50" />
      </div>
    </main>
  );
}
