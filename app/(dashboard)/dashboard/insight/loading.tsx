function Bar({ className }: { className: string }) {
  return <div className={`bg-muted ${className}`} />;
}

export default function InsightLoading() {
  return (
    <main
      aria-busy="true"
      className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12 animate-pulse"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <Bar className="h-10 w-64 rounded-xl" />
        <Bar className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Bar className="h-72 rounded-2xl" />
          <Bar className="h-72 rounded-2xl" />
        </div>
        <Bar className="h-64 rounded-2xl" />
      </div>
    </main>
  );
}
