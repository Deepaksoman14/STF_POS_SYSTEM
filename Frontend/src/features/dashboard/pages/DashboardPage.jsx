import { useEffect, useState } from "react";
import { fetchDashboardSummary } from "../../../api/dashboardApi";
import { extractApiError } from "../../../api/client";
import StatCard from "../../../components/ui/StatCard";
import { useI18n } from "../../../i18n/useI18n";
import { formatCurrency, getBusinessProfile } from "../../../utils/formatters";

function DashboardPage() {
  const profile = getBusinessProfile();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      try {
        const data = await fetchDashboardSummary();
        if (mounted) {
          setSummary(data);
        }
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, "Failed to load dashboard"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h2>{t("dashboard.title")}</h2>
      <p className="muted">{profile.name} {t("dashboard.summary")}</p>
      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">{t("dashboard.loading")}</p>}
      {!loading && summary && (
        <div className="grid-4">
          <StatCard
            title={t("dashboard.todaySales")}
            value={formatCurrency(Number(summary.todaySales), profile.currency, profile.locale)}
            hint={t("dashboard.liveFromBackend")}
          />
          <StatCard title={t("dashboard.billsCreated")} value={String(summary.billsCount)} hint={t("dashboard.today")} />
          <StatCard title={t("dashboard.lowStockItems")} value={String(summary.lowStockItems)} hint={t("dashboard.atOrBelow")} />
          <StatCard
            title={t("dashboard.outstandingCredit")}
            value={formatCurrency(Number(summary.creditOutstanding), profile.currency, profile.locale)}
            hint={t("dashboard.acrossCustomers")}
          />
        </div>
      )}
    </div>
  );
}

export default DashboardPage;