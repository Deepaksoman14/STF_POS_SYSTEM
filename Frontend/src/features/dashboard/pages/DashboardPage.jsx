import { useEffect, useMemo, useState } from "react";
import { fetchDashboardSummary } from "../../../api/dashboardApi";
import { extractApiError } from "../../../api/client";
import StatCard from "../../../components/ui/StatCard";
import DataTable from "../../../components/ui/DataTable";
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

  const billColumns = useMemo(() => ([
    { key: "billNo", label: "Bill No" },
    { key: "dateTime", label: "Date & Time" },
    { key: "customer", label: "Customer" },
    { key: "paymentMode", label: "Payment" },
    { key: "gross", label: "Gross" },
    { key: "discount", label: "Discount" },
    { key: "net", label: "Net Total" },
    { key: "createdBy", label: "Created By" }
  ]), []);

  const billRows = useMemo(() => {
    if (!summary?.recentBills) return [];

    return summary.recentBills.map((item) => ({
      id: item.id,
      billNo: `#${item.bill_no}`,
      dateTime: new Date(item.created_at).toLocaleString(profile.locale),
      customer: item.customer_name || "Walk-in",
      paymentMode: String(item.payment_mode || "-").toUpperCase(),
      gross: formatCurrency(Number(item.gross_total), profile.currency, profile.locale),
      discount: formatCurrency(Number(item.discount), profile.currency, profile.locale),
      net: formatCurrency(Number(item.net_total), profile.currency, profile.locale),
      createdBy: item.created_by
    }));
  }, [summary?.recentBills, profile.currency, profile.locale]);

  return (
    <div>
      <h2>{t("dashboard.title")}</h2>
      <p className="muted">{profile.name} {t("dashboard.summary")}</p>
      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">{t("dashboard.loading")}</p>}
      {!loading && summary && (
        <>
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

          <div className="grid-3">
            <StatCard
              title="Average Bill Value"
              value={formatCurrency(Number(summary.avgBillValue), profile.currency, profile.locale)}
              hint="Today"
            />
            <StatCard
              title="Recent Bills"
              value={String(summary.recentBills?.length || 0)}
              hint="Last 20 checkouts"
            />
            <StatCard
              title="Latest Bill"
              value={summary.recentBills?.[0]?.bill_no ? `#${summary.recentBills[0].bill_no}` : "-"}
              hint={summary.recentBills?.[0]?.payment_mode ? String(summary.recentBills[0].payment_mode).toUpperCase() : "No sales"}
            />
          </div>

          <div className="section-gap" />
          <h3>Recent Bill Details</h3>
          <p className="muted">Each completed checkout is listed here in real time order.</p>
          <DataTable columns={billColumns} rows={billRows} />
        </>
      )}
    </div>
  );
}

export default DashboardPage;
