import { Link } from "react-router-dom";

const capabilities = [
  {
    title: "Billing & Checkout",
    description: "Fast POS billing with discounts, payment modes, and printable bill support-ready workflows."
  },
  {
    title: "Product & Inventory",
    description: "Central product catalog, stock tracking, reorder alerts, and structured SKU management."
  },
  {
    title: "Customer Management",
    description: "Maintain customer records, credit tracking, and transaction history visibility."
  },
  {
    title: "Reports & Insights",
    description: "Daily sales snapshots, bill counts, average ticket value, and low-stock visibility."
  }
];

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <span className="brand-chip">Business Suite</span>
          <h1>POS Core</h1>
        </div>
        <div className="landing-auth-actions">
          <Link to="/login" className="landing-link-btn">Login</Link>
          <Link to="/register" className="landing-link-btn primary">Sign Up</Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero card">
          <p className="landing-kicker">World Standard Retail POS Platform</p>
          <h2>Run billing, inventory, customers, and reports from one secure system.</h2>
          <p className="muted">
            Built for operational reliability and fast adoption. New account requests are approval-based,
            so your organization controls who gets access.
          </p>
          <div className="landing-hero-cta">
            <Link to="/register" className="landing-link-btn primary">Request Access</Link>
            <Link to="/login" className="landing-link-btn">Existing Client Login</Link>
          </div>
        </section>

        <section className="landing-capabilities">
          {capabilities.map((item) => (
            <article key={item.title} className="card landing-capability-card">
              <h3>{item.title}</h3>
              <p className="muted">{item.description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
