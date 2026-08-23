import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YieldLens - Bond Portfolio Analytics",
  description:
    "A fixed-income analytics workspace for portfolio value, risk, gain/loss, exposure, and rate scenarios.",
};

const metrics = [
  ["Portfolio Value", "INR 6,048.75", "Across 2 sample positions"],
  ["Gain/Loss", "+INR 33.75", "Return on cost: 0.56%"],
  ["Weighted Yield", "8.16%", "100% data coverage"],
  ["Avg Duration", "3.85 yrs", "Duration-based risk view"],
];

const positions = [
  ["Adani Ports 2030 NCD", "AA", "8.45%", "INR 5,035.50", "+INR 25.50"],
  ["Tata Motors 2030 NCD", "AA+", "8.25%", "INR 1,013.25", "+INR 8.25"],
  ["Axis Bank 2032 Bond", "AAA", "8.00%", "INR 1,018.20", "+INR 18.20"],
  ["Muthoot Finance 2028", "AA", "8.90%", "INR 998.40", "-INR 6.60"],
];

const stack = [
  "FastAPI",
  "SQLAlchemy",
  "PostgreSQL",
  "Pydantic",
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "TanStack Query",
  "Recharts",
];

const architecture = [
  ["Provider layer", "Demo, live, and hybrid bond-data adapters normalize securities into one schema."],
  ["Portfolio engine", "Positions reference a normalized bond master and store user-specific quantity and prices."],
  ["SQL analytics", "Exposure, duration, DV01, maturity buckets, and gain/loss are aggregated close to the data."],
  ["Decision UI", "A compact dashboard turns backend analytics into charts, tables, and scenario controls."],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <div>
            <span className="brand-kicker">YieldLens</span>
            <p>A command desk for fixed-income clarity</p>
          </div>
          <a href="#case-study" className="nav-link">
            View case study
          </a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Resume-ready full-stack project</span>
            <h1>See bonds like a desk would.</h1>
            <p>
              YieldLens is a fixed-income portfolio analytics workspace with a typed Python API,
              normalized bond data, SQL-backed metrics, and a polished Next.js dashboard.
            </p>
            <div className="cta-row">
              <a href="#demo" className="button primary">
                Explore live demo
              </a>
              <a href="#architecture" className="button secondary">
                Read architecture
              </a>
            </div>
          </div>

          <div className="terminal-card" id="demo" aria-label="YieldLens demo dashboard preview">
            <div className="terminal-top">
              <div>
                <span className="mini-label">Portfolio tape</span>
                <h2>Core Bond Workspace</h2>
              </div>
              <span className="pill">INR</span>
            </div>
            <div className="metric-grid">
              {metrics.map(([label, value, note]) => (
                <div className="metric" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{note}</small>
                </div>
              ))}
            </div>
            <div className="chart-row" aria-hidden="true">
              {[34, 58, 47, 72, 42, 88, 63, 76, 51, 69, 45, 82].map((height, index) => (
                <div className="chart-track" key={`${height}-${index}`}>
                  <span
                    className={index % 4 === 0 ? "bar copper" : index % 3 === 0 ? "bar brass" : "bar teal"}
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="table">
              <div className="table-head">
                <span>Bond</span>
                <span>Rating</span>
                <span>Coupon</span>
                <span>Value</span>
                <span>Gain/Loss</span>
              </div>
              {positions.map(([bond, rating, coupon, value, gain]) => (
                <div className="table-row" key={bond}>
                  <span>{bond}</span>
                  <span>{rating}</span>
                  <span>{coupon}</span>
                  <span>{value}</span>
                  <span className={gain.startsWith("+") ? "gain" : "loss"}>{gain}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="case-study">
        <div className="section-heading">
          <span className="eyebrow">What it demonstrates</span>
          <h2>Built as a production-style MVP, not a static mockup.</h2>
          <p>
            The source project includes a real FastAPI backend, migrations, CSV import, provider
            abstraction, analytics services, tests, and a Next.js portfolio dashboard.
          </p>
        </div>
        <div className="feature-grid">
          <article>
            <span>01</span>
            <h3>Portfolio workflows</h3>
            <p>Create, rename, inspect, import, and manage bond positions with validation on both sides.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Analytics engine</h3>
            <p>Market value, gain/loss, weighted yield, duration, DV01, maturity buckets, and exposure.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Risk scenarios</h3>
            <p>Duration-based interest-rate shock analysis for common basis-point moves.</p>
          </article>
        </div>
      </section>

      <section className="section split" id="architecture">
        <div>
          <span className="eyebrow">Architecture</span>
          <h2>Clean boundaries from provider data to portfolio insight.</h2>
          <p>
            YieldLens separates data acquisition, normalization, persistence, analytics, API
            contracts, and UI state. That makes the project easy to explain, test, and extend.
          </p>
        </div>
        <div className="architecture-list">
          {architecture.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">Stack</span>
          <h2>Modern full-stack tools, chosen for clarity.</h2>
        </div>
        <div className="stack">
          {stack.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <footer>
        <strong>YieldLens</strong>
        <span>
          Educational fixed-income analytics project. Demo data is used in this public showcase.
        </span>
      </footer>
    </main>
  );
}
