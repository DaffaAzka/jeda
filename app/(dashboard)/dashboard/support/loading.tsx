function Bar({ className }: { className: string }) {
  return <div className={`bg-muted ${className}`} />;
}

export default function SupportLoading() {
  return (
    <main
      aria-busy="true"
      className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12 animate-pulse"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <Bar className="h-40 w-full rounded-2xl" />
        <Bar className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Bar className="h-44 rounded-xl" />
          <Bar className="h-44 rounded-xl" />
          <Bar className="h-44 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
