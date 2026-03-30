import { Link } from "react-router-dom";
import { useI18n } from "../../../i18n/useI18n";

const COPYRIGHT_TEXT = `Copyright © ${new Date().getFullYear()} Soman Tech Foundry. All rights reserved.`;

function LandingPage() {
  const { t } = useI18n();

  const capabilities = [
    {
      title: t("landing.capabilityBillingTitle"),
      description: t("landing.capabilityBillingDesc")
    },
    {
      title: t("landing.capabilityProductTitle"),
      description: t("landing.capabilityProductDesc")
    },
    {
      title: t("landing.capabilityCustomerTitle"),
      description: t("landing.capabilityCustomerDesc")
    },
    {
      title: t("landing.capabilityReportsTitle"),
      description: t("landing.capabilityReportsDesc")
    }
  ];

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <span className="brand-chip">{t("landing.brandChip")}</span>
          <h1>POS Core</h1>
        </div>
        <div className="landing-auth-actions">
          <Link to="/login" className="landing-link-btn">{t("landing.login")}</Link>
          <Link to="/register" className="landing-link-btn primary">{t("landing.signUp")}</Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero card">
          <p className="landing-kicker">{t("landing.kicker")}</p>
          <h2>{t("landing.heroTitle")}</h2>
          <p className="muted">{t("landing.heroDesc")}</p>
          <div className="landing-hero-cta">
            <Link to="/register" className="landing-link-btn primary">{t("landing.requestAccess")}</Link>
            <Link to="/login" className="landing-link-btn">{t("landing.existingLogin")}</Link>
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

      <p className="app-copyright centered-copy">{COPYRIGHT_TEXT}</p>
    </div>
  );
}

export default LandingPage;


