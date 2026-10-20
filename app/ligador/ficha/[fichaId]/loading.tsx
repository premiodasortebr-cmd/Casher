export default function FichaLoading() {
  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="h-9 w-16 animate-pulse rounded-full bg-surface-3" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-surface-3" />
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-3" />
        <div className="flex gap-2">
          <div className="h-12 flex-1 animate-pulse rounded-full bg-surface-2" />
          <div className="h-12 w-24 animate-pulse rounded-full bg-surface-2" />
        </div>
        <div className="h-48 animate-pulse rounded-3xl bg-surface-2" />
        <div className="h-44 animate-pulse rounded-3xl bg-surface-2" />
        <div className="h-36 animate-pulse rounded-3xl bg-surface-2" />
      </main>
    </div>
  );
}
