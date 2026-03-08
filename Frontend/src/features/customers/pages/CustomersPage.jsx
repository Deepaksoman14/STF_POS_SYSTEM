import { useEffect, useState } from "react";
import { createCustomer, fetchCustomers } from "../../../api/customerApi";
import { extractApiError } from "../../../api/client";
import DataTable from "../../../components/ui/DataTable";
import { canAccess } from "../../../app/permissions";
import { useAuthStore } from "../../../store/authStore";
import { useI18n } from "../../../i18n/useI18n";

const initialForm = {
  name: "",
  mobile: "",
  village: "",
  creditDue: "0"
};

function CustomersPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState("");
  const canManage = canAccess(user?.role, "customers");

  async function loadCustomers() {
    const data = await fetchCustomers();
    setRows(
      data.map((item) => ({
        id: item.id,
        name: item.name,
        mobile: item.mobile,
        village: item.village,
        credit: Number(item.credit_due)
      }))
    );
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const data = await fetchCustomers();
        if (!mounted) return;

        setRows(
          data.map((item) => ({
            id: item.id,
            name: item.name,
            mobile: item.mobile,
            village: item.village,
            credit: Number(item.credit_due)
          }))
        );
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, "Failed to load customers"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleCreateCustomer(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessText("");

    try {
      await createCustomer({
        name: form.name,
        mobile: form.mobile,
        village: form.village,
        creditDue: Number(form.creditDue || 0)
      });

      await loadCustomers();
      setForm(initialForm);
      setSuccessText(t("customers.success"));
    } catch (err) {
      setError(extractApiError(err, "Failed to create customer"));
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: "name", label: t("customers.customer") },
    { key: "mobile", label: t("customers.mobile") },
    { key: "village", label: t("customers.village") },
    { key: "credit", label: t("customers.creditDue") }
  ];

  return (
    <div>
      <h2>{t("customers.title")}</h2>
      <p className="muted">{t("customers.subtitle")}</p>

      {canManage && (
        <form className="card section-gap" onSubmit={handleCreateCustomer}>
          <h3>{t("customers.addCustomer")}</h3>
          <div className="form-grid">
            <input placeholder={t("customers.customerName")} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <input placeholder={t("customers.mobile")} value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} required />
            <input placeholder={t("customers.village")} value={form.village} onChange={(e) => setForm((p) => ({ ...p, village: e.target.value }))} required />
            <input type="number" placeholder={t("customers.creditDue")} value={form.creditDue} onChange={(e) => setForm((p) => ({ ...p, creditDue: e.target.value }))} />
          </div>
          <div className="actions">
            <button type="submit" disabled={submitting}>{submitting ? t("customers.saving") : t("customers.createCustomer")}</button>
          </div>
        </form>
      )}

      {error && <p className="error-text">{error}</p>}
      {successText && <p className="success-text">{successText}</p>}
      {loading ? <p className="muted">{t("customers.loading")}</p> : <DataTable columns={columns} rows={rows} />}
    </div>
  );
}

export default CustomersPage;