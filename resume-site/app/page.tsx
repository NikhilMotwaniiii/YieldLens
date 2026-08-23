export default function Home() {
  return (
    <main className="backend-status-page">
      <section className="backend-status-card">
        <span className="eyebrow">YieldLens backend</span>
        <h1>API is online.</h1>
        <p>
          This ChatGPT-hosted deployment is the persistence and analytics API for YieldLens. The
          public product frontend is served from GitHub Pages.
        </p>
        <div className="backend-actions">
          <a className="primary-action" href="https://nikhilmotwaniiii.github.io/YieldLens/">
            Open GitHub Pages frontend
          </a>
          <a className="ghost-action" href="/api/bonds">
            View demo bond API
          </a>
        </div>
        <dl className="endpoint-list">
          <div>
            <dt>Frontend</dt>
            <dd>https://nikhilmotwaniiii.github.io/YieldLens/</dd>
          </div>
          <div>
            <dt>Portfolio API</dt>
            <dd>/api/portfolios</dd>
          </div>
          <div>
            <dt>Bond universe API</dt>
            <dd>/api/bonds</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
