// Instant feedback while a trip page loads (server data, and the first compile in development).
export default function TripLoading() {
  return <main aria-busy="true" aria-live="polite" className="min-h-screen bg-background pb-12">
    <div className="relative h-[300px] w-full animate-pulse bg-gradient-to-b from-elevated to-background sm:h-[360px]">
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-end gap-4 px-4 pb-8 sm:px-6 lg:px-10"><div className="h-6 w-40 rounded-full bg-muted" /><div className="h-12 w-2/3 max-w-xl rounded-2xl bg-muted" /><div className="h-5 w-1/3 max-w-sm rounded-full bg-muted" /></div>
    </div>
    <div className="px-4 pt-6 sm:px-6 lg:px-10"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((index) => <div key={index} className="h-28 animate-pulse rounded-card bg-card" />)}</div><p className="sr-only">A carregar…</p></div>
  </main>;
}
