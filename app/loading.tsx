export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-4xl">
          <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 h-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-32 animate-pulse rounded-lg border border-dashed border-slate-300 bg-white" />
      </main>
    </div>
  );
}
