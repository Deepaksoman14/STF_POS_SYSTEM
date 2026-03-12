import { useEffect, useMemo, useState } from "react";
import { fetchDashboardSummary } from "../../../api/dashboardApi";
import { extractApiError } from "../../../api/client";
import StatCard from "../../../components/ui/StatCard";
import DataTable from "../../../components/ui/DataTable";
import { useI18n } from "../../../i18n/useI18n";
import { formatCurrency, getBusinessProfile } from "../../../utils/formatters";

function formatMetric(value, formatter) {
  if (value === null || value === undefined) return "--";
  return formatter ? formatter(value) : String(value);
}

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
          <div className="grid-6">
            <StatCard
              title="Total Sales"
              value={formatMetric(summary.totalSales, (value) => formatCurrency(Number(value), profile.currency, profile.locale))}
              hint="All time"
            />
            <StatCard
              title="Total Profit"
              value={formatMetric(summary.totalProfit, (value) => formatCurrency(Number(value), profile.currency, profile.locale))}
              hint="Needs cost price"
            />
            <StatCard
              title="Total Quantity Sold"
              value={formatMetric(summary.totalQtySold)}
              hint="All time"
            />
            <StatCard
              title="Total Invoices"
              value={formatMetric(summary.totalInvoices)}
              hint="All time"
            />
            <StatCard
              title="Daily Average Sales"
              value={formatMetric(summary.dailyAverageSales, (value) => formatCurrency(Number(value), profile.currency, profile.locale))}
              hint="Across active days"
            />
            <StatCard
              title="Profit Margin %"
              value={formatMetric(summary.profitMargin, (value) => `${Number(value).toFixed(2)}%`)}
              hint="Needs cost price"
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
