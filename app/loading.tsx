export default function Loading() {
  const skeletonCards = Array.from({ length: 6 });

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="aurora-blob aurora-blob--indigo -top-56 -left-24" />
      <div className="aurora-blob aurora-blob--purple top-1/3 -right-48" />
      <div className="aurora-blob aurora-blob--teal top-[65%] -left-40" />
      <div className="home-hero-ambient" />
      <div className="grid-overlay" />

      <div className="relative z-10 flex min-h-screen lg:pl-72">
        <aside className="hidden h-screen w-72 flex-col gap-4 border-r border-white/10 bg-white/[0.06] px-6 py-8 backdrop-blur-2xl lg:flex">
          <div className="h-11 w-11 rounded-2xl bg-white/10" />
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="space-y-3 pt-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`nav-skeleton-${idx}`} className="h-12 rounded-xl bg-white/5" />
            ))}
          </div>
        </aside>

        <div className="flex w-full flex-col">
          <div className="relative h-20 border-b border-white/10 bg-slate-950/60 backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-70" />
            <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-8">
              <div className="h-11 w-11 rounded-xl border border-white/10 bg-white/5" />
              <div className="flex flex-col gap-2">
                <div className="h-3 w-32 rounded bg-white/10" />
                <div className="h-3 w-48 rounded bg-white/5" />
              </div>
              <div className="ml-auto hidden h-10 w-64 rounded-2xl border border-white/10 bg-white/5 lg:block" />
              <div className="h-11 w-28 rounded-xl border border-white/10 bg-white/5" />
            </div>
          </div>

          <main className="flex-1 overflow-x-hidden pb-28">
            <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
              <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.04] shadow-[0_50px_140px_rgba(15,23,42,0.55)]" />
              <div className="pointer-events-none absolute inset-4 -z-10 rounded-[3rem] bg-gradient-to-br from-indigo-500/15 via-transparent to-sky-400/10 blur-3xl opacity-70" />
              <div className="pointer-events-none absolute inset-x-10 top-6 -z-10 h-32 rounded-full bg-gradient-to-r from-indigo-400/20 via-transparent to-purple-400/20 blur-2xl" />

              <div className="space-y-12">
                <section className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.05] px-6 py-12 shadow-[0_40px_120px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:px-10 lg:px-12">
                  <div className="absolute -right-40 -top-48 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/25 to-cyan-400/20 blur-3xl" />
                  <div className="absolute -bottom-52 -left-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-cyan-400/15 via-teal-400/20 to-transparent blur-[200px]" />
                  <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-5 lg:max-w-xl">
                      <div className="h-3 w-32 rounded bg-white/10" />
                      <div className="h-9 w-3/4 rounded bg-white/10" />
                      <div className="h-3 w-full rounded bg-white/5" />
                      <div className="h-3 w-4/5 rounded bg-white/5" />
                      <div className="mt-6 flex flex-wrap gap-3">
                        <div className="h-12 w-40 rounded-2xl border border-white/10 bg-white/5" />
                        <div className="h-12 w-40 rounded-2xl border border-white/10 bg-white/5" />
                      </div>
                    </div>
                    <div className="relative w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl">
                      <div className="h-3 w-28 rounded bg-white/10" />
                      <div className="mt-4 h-12 rounded-2xl border border-white/10 bg-white/5" />
                      <div className="mt-3 h-12 rounded-2xl border border-white/10 bg-white/5" />
                      <div className="mt-6 h-10 rounded-2xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd]" />
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-5 sm:px-7 sm:py-6">
                    <div className="space-y-3">
                      <div className="h-4 w-52 rounded bg-white/10" />
                      <div className="h-3 w-64 rounded bg-white/5" />
                    </div>
                    <div className="h-11 w-60 rounded-2xl border border-white/10 bg-white/5" />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {skeletonCards.map((_, idx) => (
                      <div
                        key={`grid-skeleton-${idx}`}
                        className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)]"
                      >
                        <div className="relative h-40 overflow-hidden rounded-2xl bg-white/5">
                          <span
                            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            style={{ animation: "shimmer 2.4s linear infinite" }}
                          />
                        </div>
                        <div className="mt-6 h-4 w-3/4 rounded bg-white/10" />
                        <div className="mt-3 h-3 w-2/3 rounded bg-white/10" />
                        <div className="mt-8 h-10 rounded-xl bg-white/10" />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
