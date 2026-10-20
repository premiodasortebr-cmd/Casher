export default function LigadorLoading() {
  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 px-4 py-3.5 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="h-7 w-7 animate-pulse rounded-lg bg-surface-3" />
          <div className="flex items-center gap-3">
            <div className="size-8 animate-pulse rounded-full bg-surface-3" />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="h-28 animate-pulse rounded-3xl bg-surface-2" />
        <div className="h-32 animate-pulse rounded-3xl bg-surface-2" />
        <div className="flex gap-1.5">
          <div className="h-9 w-16 animate-pulse rounded-full bg-surface-2" />
          <div className="h-9 w-20 animate-pulse rounded-full bg-surface-2" />
          <div className="h-9 w-20 animate-pulse rounded-full bg-surface-2" />
        </div>
        <div className="h-11 animate-pulse rounded-xl bg-surface-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-3xl bg-surface-2" />
        ))}
      </main>
    </div>
  );
}
