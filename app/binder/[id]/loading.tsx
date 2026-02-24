export default function BinderLoading() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-1 h-4 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 h-20 animate-pulse rounded-lg bg-slate-200" />
        <div className="mb-6 flex justify-between">
          <div className="h-10 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded border border-slate-100 bg-slate-50 p-2"
            >
              <div className="h-16 w-16 animate-pulse rounded bg-slate-200" />
              <div className="mt-1 h-3 w-12 animate-pulse rounded bg-slate-100" />
              <div className="mt-1 h-4 w-12 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
