import { HomeActions } from "@/components/portfolio/HomeActions";

export default function Home() {
  const rows = [
    ["Adani Ports 2030", "AA", "8.45%", "+0.51%"],
    ["Axis Bank 2032", "AAA", "8.00%", "+0.18%"],
    ["Muthoot Finance 2028", "AA", "8.90%", "-0.24%"],
    ["Bank of Baroda 2034", "AAA", "7.99%", "+0.33%"]
  ];

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between rounded-md bg-night px-5 py-4 text-panel shadow-desk">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9d8d2]">YieldLens</p>
            <p className="mt-1 text-sm text-[#bfc6bd]">A command desk for fixed-income clarity</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-[#bfc6bd] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Demo desk online
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-sm bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Bond intelligence workspace
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-normal text-ink md:text-7xl">
              See your bonds like a desk would.
            </h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-muted">
              Track value, risk, income, and return signals in a calm workspace built for decisions,
              not spreadsheet hunting.
            </p>
            <HomeActions />
          </div>

          <div className="rounded-md border border-night/15 bg-night p-4 text-panel shadow-desk md:p-5">
            <div className="flex items-center justify-between border-b border-panel/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9d8d2]">Portfolio tape</p>
                <p className="mt-1 text-sm text-[#bfc6bd]">Demo bond universe</p>
              </div>
              <span className="rounded-sm bg-panel px-2.5 py-1 text-xs font-semibold text-night">INR</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Market value", "₹6,048.75"],
                ["Gain/Loss", "+₹33.75"],
                ["DV01", "₹2.33"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-panel/10 bg-panel/10 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#bfc6bd]">{label}</p>
                  <p className="tabular mt-2 text-xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-md border border-panel/10">
              <div className="grid grid-cols-[1fr_56px_70px_70px] bg-panel/10 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-[#bfc6bd]">
                <span>Bond</span>
                <span>Rate</span>
                <span>Coupon</span>
                <span>Return</span>
              </div>
              {rows.map(([bond, rating, coupon, gain]) => (
                <div
                  key={bond}
                  className="grid grid-cols-[1fr_56px_70px_70px] border-t border-panel/10 px-3 py-3 text-sm"
                >
                  <span className="truncate font-medium">{bond}</span>
                  <span className="text-[#bfc6bd]">{rating}</span>
                  <span className="tabular text-[#bfc6bd]">{coupon}</span>
                  <span className={`tabular font-semibold ${gain.startsWith("+") ? "text-[#7ce0c6]" : "text-[#ff9c91]"}`}>
                    {gain}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-12 items-end gap-2">
              {[34, 58, 47, 72, 42, 88, 63, 76, 51, 69, 45, 82].map((height, index) => (
                <div key={`${height}-${index}`} className="flex h-24 items-end rounded-sm bg-panel/10 p-1">
                  <div
                    className={`w-full rounded-sm ${index % 3 === 0 ? "bg-brass" : index % 4 === 0 ? "bg-copper" : "bg-accent"}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-line py-5 text-xs leading-5 text-muted">
          YieldLens is an educational portfolio analytics project. Market data may be delayed or
          unavailable. Analytics are simplified estimates and do not constitute investment advice.
        </footer>
      </div>
    </main>
  );
}
