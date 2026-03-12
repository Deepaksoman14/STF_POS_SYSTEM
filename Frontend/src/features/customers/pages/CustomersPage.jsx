import { useEffect, useMemo, useState } from "react";
import { createCustomer, deleteCustomer, fetchCustomers, updateCustomer } from "../../../api/customerApi";
import { extractApiError } from "../../../api/client";
import { canAccess } from "../../../app/permissions";
import { useAuthStore } from "../../../store/authStore";
import { useI18n } from "../../../i18n/useI18n";

const initialForm = {
  name: "",
  mobile: "",
  village: "",
  creditDue: "0"
};

const PAGE_SIZE = 10;

function CustomersPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(initialForm);
  const canManage = canAccess(user?.role, "customers");

  async function loadCustomers() {
    const data = await fetchCustomers();
    setRows(
      data.map((item) => ({
        id: item.id,
        name: item.name,
        mobile: item.mobile,
        village: item.village,
        credit: Number(item.credit_due),
        createdAt: item.created_at
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
            credit: Number(item.credit_due),
            createdAt: item.created_at
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

  const filteredSortedRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = term
      ? rows.filter((row) => (
          row.name.toLowerCase().includes(term) ||
          row.mobile.toLowerCase().includes(term) ||
          row.village.toLowerCase().includes(term)
        ))
      : rows;

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDir === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDir === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return sorted;
  }, [rows, searchTerm, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredSortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir("asc");
  }

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

  function beginEdit(row) {
    setEditingId(row.id);
    setEditForm({
      name: row.name,
      mobile: row.mobile,
      village: row.village,
      creditDue: String(row.credit)
    });
  }

  async function handleUpdateCustomer(event) {
    event.preventDefault();
    if (!editingId) return;

    setSubmitting(true);
    setError("");
    setSuccessText("");

    try {
      await updateCustomer(editingId, {
        name: editForm.name,
        mobile: editForm.mobile,
        village: editForm.village,
        creditDue: Number(editForm.creditDue || 0)
      });

      await loadCustomers();
      setEditingId("");
      setEditForm(initialForm);
      setSuccessText("Customer updated successfully.");
    } catch (err) {
      setError(extractApiError(err, "Failed to update customer"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCustomer(id) {
    if (!window.confirm("Delete this customer?")) return;

    setError("");
    setSuccessText("");

    try {
      await deleteCustomer(id);
      await loadCustomers();
      setSuccessText("Customer deleted successfully.");
    } catch (err) {
      setError(extractApiError(err, "Failed to delete customer"));
    }
  }

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

      {canManage && editingId && (
        <form className="card section-gap" onSubmit={handleUpdateCustomer}>
          <h3>Edit Customer</h3>
          <div className="form-grid">
            <input placeholder={t("customers.customerName")} value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required />
            <input placeholder={t("customers.mobile")} value={editForm.mobile} onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))} required />
            <input placeholder={t("customers.village")} value={editForm.village} onChange={(e) => setEditForm((p) => ({ ...p, village: e.target.value }))} required />
            <input type="number" placeholder={t("customers.creditDue")} value={editForm.creditDue} onChange={(e) => setEditForm((p) => ({ ...p, creditDue: e.target.value }))} />
          </div>
          <div className="actions">
            <button type="button" className="ghost" onClick={() => setEditingId("")}>Cancel</button>
            <button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Update Customer"}</button>
          </div>
        </form>
      )}

      {error && <p className="error-text">{error}</p>}
      {successText && <p className="success-text">{successText}</p>}

      {loading ? (
        <p className="muted">{t("customers.loading")}</p>
      ) : (
        <div className="card section-gap table-enhanced-wrap">
          <div className="table-toolbar">
            <input
              className="table-search"
              placeholder="Search by customer, mobile, village"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
            />
            <p className="muted small">Showing {pagedRows.length} of {filteredSortedRows.length} records</p>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th><button type="button" className="table-sort-btn" onClick={() => handleSort("name")}>{t("customers.customer")}</button></th>
                  <th><button type="button" className="table-sort-btn" onClick={() => handleSort("mobile")}>{t("customers.mobile")}</button></th>
                  <th><button type="button" className="table-sort-btn" onClick={() => handleSort("village")}>{t("customers.village")}</button></th>
                  <th><button type="button" className="table-sort-btn" onClick={() => handleSort("credit")}>{t("customers.creditDue")}</button></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.mobile}</td>
                    <td>{row.village}</td>
                    <td>{row.credit}</td>
                    <td>
                      {canManage ? (
                        <div className="row-actions">
                          <button type="button" className="ghost" onClick={() => beginEdit(row)}>Edit</button>
                          <button type="button" className="ghost danger-ghost" onClick={() => handleDeleteCustomer(row.id)}>Delete</button>
                        </div>
                      ) : "-"}
                    </td>
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
      )}
    </div>
  );
}

export default CustomersPage;
