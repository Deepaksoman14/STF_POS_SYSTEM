import { useEffect, useMemo, useRef, useState } from "react";
import { fetchDashboardSummary } from "../../../api/dashboardApi";
import { extractApiError } from "../../../api/client";
import StatCard from "../../../components/ui/StatCard";
import { useI18n } from "../../../i18n/useI18n";
import { formatCurrency, getBusinessProfile } from "../../../utils/formatters";

const PAGE_SIZE = 5;

function toDateInputValue(date) {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
}

function getQuickRange(fromDate, toDate) {
  if (!fromDate && !toDate) return "all";

  const today = new Date();
  const todayText = toDateInputValue(today);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthText = toDateInputValue(thisMonthStart);
  if (fromDate === thisMonthText && toDate === todayText) return "thisMonth";

  const last7Start = new Date(today);
  last7Start.setDate(today.getDate() - 6);
  const last7Text = toDateInputValue(last7Start);
  if (fromDate === last7Text && toDate === todayText) return "last7";

  if (fromDate === todayText && toDate === todayText) return "today";

  return "custom";
}

function formatMetric(value, formatter) {
  if (value === null || value === undefined) return "--";
  return formatter ? formatter(value) : String(value);
}

function formatRangeLabel(fromDate, toDate) {
  const quick = getQuickRange(fromDate, toDate);
  if (quick === "today") return "Today";
  if (quick === "last7") return "Last 7 Days";
  if (quick === "thisMonth") return "This Month";
  if (quick === "all") return "All Time";

  if (fromDate && toDate) return `${fromDate} to ${toDate}`;
  if (fromDate) return `From ${fromDate}`;
  return `Up to ${toDate}`;
}

function DashboardPage() {
  const profile = getBusinessProfile();
  const { t } = useI18n();
  const filterRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFromDate, setAppliedFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return toDateInputValue(date);
  });
  const [appliedToDate, setAppliedToDate] = useState(() => toDateInputValue(new Date()));
  const [draftFromDate, setDraftFromDate] = useState(appliedFromDate);
  const [draftToDate, setDraftToDate] = useState(appliedToDate);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setDraftFromDate(appliedFromDate);
        setDraftToDate(appliedToDate);
        setIsFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [appliedFromDate, appliedToDate]);

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      setLoading(true);
      setError("");
      try {
        if (appliedFromDate && appliedToDate && appliedFromDate > appliedToDate) {
          throw new Error("From date cannot be later than to date");
        }

        const data = await fetchDashboardSummary({ fromDate: appliedFromDate, toDate: appliedToDate });
        if (mounted) {
          setSummary(data);
          setPage(1);
        }
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, "Failed to load dashboard"));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSummary();

    return () => {
      mounted = false;
    };
  }, [appliedFromDate, appliedToDate]);

  const billColumns = useMemo(() => ([
    { key: "billNo", label: "Bill No" },
    { key: "billType", label: "Bill Type" },
    { key: "dateTime", label: "Date & Time" },
    { key: "customer", label: "Customer / Supplier" },
    { key: "paymentMode", label: "Payment" },
    { key: "gross", label: "Gross" },
    { key: "discount", label: "Discount" },
    { key: "net", label: "Net Total" },
    { key: "createdBy", label: "Created By" }
  ]), []);

  const billRows = useMemo(() => {
    if (!summary?.recentBills) return [];

    return summary.recentBills.map((item) => ({
      id: `${item.bill_type}-${item.id}`,
      billNo: `#${item.bill_no}`,
      billTypeKey: String(item.bill_type || "retail_order"),
      billType: String(item.bill_type || "retail_order")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (ch) => ch.toUpperCase()),
      createdAt: item.created_at,
      dateTime: new Date(item.created_at).toLocaleString(profile.locale),
      customer: item.customer_name || "-",
      paymentMode: String(item.payment_mode || "-").toUpperCase(),
      grossValue: Number(item.gross_total),
      discountValue: Number(item.discount),
      netValue: Number(item.net_total),
      gross: formatCurrency(Number(item.gross_total), profile.currency, profile.locale),
      discount: formatCurrency(Number(item.discount), profile.currency, profile.locale),
      net: formatCurrency(Number(item.net_total), profile.currency, profile.locale),
      createdBy: item.created_by
    }));
  }, [summary?.recentBills, profile.currency, profile.locale]);

  const filteredSortedBills = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? billRows.filter((row) => (
        row.billNo.toLowerCase().includes(term) ||
        row.billType.toLowerCase().includes(term) ||
        row.customer.toLowerCase().includes(term) ||
        row.paymentMode.toLowerCase().includes(term) ||
        String(row.createdBy || "").toLowerCase().includes(term)
      ))
      : billRows;

    const numericKeys = new Set(["grossValue", "discountValue", "netValue"]);
    const dateKeys = new Set(["createdAt"]);
    const sorted = [...filtered].sort((a, b) => {
      if (numericKeys.has(sortKey)) {
        const aVal = Number(a[sortKey] || 0);
        const bVal = Number(b[sortKey] || 0);
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (dateKeys.has(sortKey)) {
        const aVal = new Date(a.createdAt).getTime();
        const bVal = new Date(b.createdAt).getTime();
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aVal = String(a[sortKey] || "");
      const bVal = String(b[sortKey] || "");
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return sorted;
  }, [billRows, searchTerm, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSortedBills.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedBills = filteredSortedBills.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const quickRange = getQuickRange(draftFromDate, draftToDate);
  const rangeLabel = formatRangeLabel(appliedFromDate, appliedToDate);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir("asc");
  }

  function applyQuickRange(type) {
    setError("");
    const today = new Date();
    const todayText = toDateInputValue(today);

    if (type === "today") {
      setDraftFromDate(todayText);
      setDraftToDate(todayText);
      return;
    }

    if (type === "last7") {
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      setDraftFromDate(toDateInputValue(from));
      setDraftToDate(todayText);
      return;
    }

    if (type === "thisMonth") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      setDraftFromDate(toDateInputValue(from));
      setDraftToDate(todayText);
      return;
    }

    setDraftFromDate("");
    setDraftToDate("");
  }

  function handleOpenFilter() {
    setError("");
    setDraftFromDate(appliedFromDate);
    setDraftToDate(appliedToDate);
    setIsFilterOpen((prev) => !prev);
  }

  function handleSubmitRange() {
    if (draftFromDate && draftToDate && draftFromDate > draftToDate) {
      setError("From date cannot be later than to date");
      return;
    }

    setError("");
    setAppliedFromDate(draftFromDate);
    setAppliedToDate(draftToDate);
    setIsFilterOpen(false);
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2>{t("dashboard.title")}</h2>
          <p className="muted">{profile.name} {t("dashboard.summary")}</p>
        </div>
        <div className="dashboard-range-inline" ref={filterRef}>
          <button
            type="button"
            className={`dashboard-range-trigger${isFilterOpen ? " active" : ""}`}
            onClick={handleOpenFilter}
          >
            <span className="small muted">Date Range</span>
            <strong>{rangeLabel}</strong>
          </button>

          {isFilterOpen && (
            <div className="dashboard-range-popover card compact">
              <div className="dashboard-filter-actions">
                <button type="button" className={quickRange === "today" ? "dashboard-chip-btn active" : "dashboard-chip-btn"} onClick={() => applyQuickRange("today")}>Today</button>
                <button type="button" className={quickRange === "last7" ? "dashboard-chip-btn active" : "dashboard-chip-btn"} onClick={() => applyQuickRange("last7")}>Last 7 Days</button>
                <button type="button" className={quickRange === "thisMonth" ? "dashboard-chip-btn active" : "dashboard-chip-btn"} onClick={() => applyQuickRange("thisMonth")}>This Month</button>
                <button type="button" className={quickRange === "all" ? "dashboard-chip-btn active" : "dashboard-chip-btn"} onClick={() => applyQuickRange("all")}>All Time</button>
              </div>
              <div className="dashboard-date-fields">
                <label className="dashboard-date-field">
                  <span className="muted small">From</span>
                  <input type="date" value={draftFromDate} onChange={(event) => setDraftFromDate(event.target.value)} />
                </label>
                <label className="dashboard-date-field">
                  <span className="muted small">To</span>
                  <input type="date" value={draftToDate} onChange={(event) => setDraftToDate(event.target.value)} />
                </label>
              </div>
              <div className="dashboard-popover-actions">
                <button type="button" className="ghost" onClick={() => {
                  setDraftFromDate(appliedFromDate);
                  setDraftToDate(appliedToDate);
                  setIsFilterOpen(false);
                }}>Cancel</button>
                <button type="button" onClick={handleSubmitRange}>Submit</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">{t("dashboard.loading")}</p>}

      {!loading && summary && (
        <>
          <div className="dashboard-kpi-grid">
            <StatCard
              title="Total Sales"
              value={formatMetric(summary.totalSales, (value) => formatCurrency(Number(value), profile.currency, profile.locale))}
              hint="Selected range"
            />
            <StatCard
              title="Total Profit"
              value={formatMetric(summary.totalProfit, (value) => formatCurrency(Number(value), profile.currency, profile.locale))}
              hint="Needs cost price"
            />
            <StatCard
              title="Total Quantity Sold"
              value={formatMetric(summary.totalQtySold)}
              hint="Selected range"
            />
            <StatCard
              title="Total Invoices"
              value={formatMetric(summary.totalInvoices)}
              hint="Selected range"
            />
          </div>

          <div className="card section-gap table-enhanced-wrap dashboard-section-card">
            <div className="section-title-row">
              <div>
                <h3>Recent Bill Details</h3>
                <p className="muted">Retail, wholesale, and purchase order entries in one timeline.</p>
              </div>
            </div>
            <div className="table-toolbar">
              <input
                className="table-search"
                placeholder="Search by bill no, bill type, customer/supplier, payment, created by"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
              />
              <p className="muted small">Showing {pagedBills.length} of {filteredSortedBills.length} records</p>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {billColumns.map((column) => (
                      <th key={column.key} className={column.key === "billType" ? "bill-type-cell" : ""}>
                        <button
                          type="button"
                          className="table-sort-btn"
                          onClick={() => handleSort(
                            column.key === "dateTime" ? "createdAt"
                              : column.key === "gross" ? "grossValue"
                                : column.key === "discount" ? "discountValue"
                                  : column.key === "net" ? "netValue"
                                    : column.key
                          )}
                        >
                          {column.label}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedBills.map((row) => (
                    <tr key={row.id}>
                      <td>{row.billNo}</td>
                      <td className="bill-type-cell">
                        <span className={`bill-type-pill ${row.billTypeKey === "purchase_order" ? "purchase" : row.billTypeKey === "wholesale_order" ? "wholesale" : "retail"}`}>
                          {row.billType}
                        </span>
                      </td>
                      <td>{row.dateTime}</td>
                      <td>{row.customer}</td>
                      <td>{row.paymentMode}</td>
                      <td>{row.gross}</td>
                      <td>{row.discount}</td>
                      <td>{row.net}</td>
                      <td>{row.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination-row">
              <button type="button" className="ghost" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <p className="small muted">Page {currentPage} of {totalPages}</p>
              <button type="button" className="ghost" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
