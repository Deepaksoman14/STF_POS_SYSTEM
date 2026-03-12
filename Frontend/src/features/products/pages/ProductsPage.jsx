import { useEffect, useMemo, useState } from "react";
import { extractApiError } from "../../../api/client";
import {
  createProduct,
  deleteProduct,
  fetchArchivedProducts,
  fetchProducts,
  restoreProduct,
  updateProduct
} from "../../../api/productApi";
import { canAccess } from "../../../app/permissions";
import { useAuthStore } from "../../../store/authStore";
import { useI18n } from "../../../i18n/useI18n";

const initialForm = {
  sku: "",
  name: "",
  category: "",
  batchNo: "",
  composition: "",
  costPrice: "",
  salePrice: "",
  stockQty: "",
  reorderLevel: ""
};

const PAGE_SIZE = 10;

function ProductsPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [archivedRows, setArchivedRows] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
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
  const canManage = canAccess(user?.role, "products");

  function mapProduct(item) {
    return {
      id: item.id,
      sku: item.sku,
      name: item.name,
      category: item.category,
      batchNo: item.batch_no,
      composition: item.composition,
      costPrice: Number(item.cost_price),
      salePrice: Number(item.sale_price),
      stockQty: Number(item.stock_qty),
      reorderLevel: Number(item.reorder_level),
      createdAt: item.created_at
    };
  }

  async function loadProducts() {
    const data = await fetchProducts();
    setRows(data.map(mapProduct));
  }

  async function loadArchivedProducts() {
    if (!canManage) return;
    const data = await fetchArchivedProducts();
    setArchivedRows(data.map(mapProduct));
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const [active, archived] = await Promise.all([
          fetchProducts(),
          canManage ? fetchArchivedProducts() : Promise.resolve([])
        ]);

        if (!mounted) return;

        setRows(active.map(mapProduct));
        setArchivedRows(archived.map(mapProduct));
      } catch (err) {
        if (mounted) setError(extractApiError(err, "Failed to load products"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [canManage]);

  const filteredSortedRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = term
      ? rows.filter((row) => (
          row.sku.toLowerCase().includes(term) ||
          row.name.toLowerCase().includes(term) ||
          row.category.toLowerCase().includes(term)
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

  async function handleCreateProduct(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessText("");

    try {
      await createProduct({
        sku: form.sku,
        name: form.name,
        category: form.category,
        batchNo: form.batchNo,
        composition: form.composition,
        costPrice: Number(form.costPrice),
        salePrice: Number(form.salePrice),
        stockQty: Number(form.stockQty),
        reorderLevel: Number(form.reorderLevel)
      });

      await Promise.all([loadProducts(), loadArchivedProducts()]);
      setForm(initialForm);
      setSuccessText(t("products.success"));
    } catch (err) {
      setError(extractApiError(err, "Failed to create product"));
    } finally {
      setSubmitting(false);
    }
  }

  function beginEdit(row) {
    setEditingId(row.id);
    setEditForm({
      sku: row.sku,
      name: row.name,
      category: row.category,
      batchNo: row.batchNo,
      composition: row.composition,
      costPrice: String(row.costPrice),
      salePrice: String(row.salePrice),
      stockQty: String(row.stockQty),
      reorderLevel: String(row.reorderLevel)
    });
  }

  async function handleUpdateProduct(event) {
    event.preventDefault();
    if (!editingId) return;

    setSubmitting(true);
    setError("");
    setSuccessText("");

    try {
      await updateProduct(editingId, {
        sku: editForm.sku,
        name: editForm.name,
        category: editForm.category,
        batchNo: editForm.batchNo,
        composition: editForm.composition,
        costPrice: Number(editForm.costPrice),
        salePrice: Number(editForm.salePrice),
        stockQty: Number(editForm.stockQty),
        reorderLevel: Number(editForm.reorderLevel)
      });

      await Promise.all([loadProducts(), loadArchivedProducts()]);
      setEditingId("");
      setEditForm(initialForm);
      setSuccessText("Product updated successfully.");
    } catch (err) {
      setError(extractApiError(err, "Failed to update product"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;

    setError("");
    setSuccessText("");

    try {
      await deleteProduct(id);
      await Promise.all([loadProducts(), loadArchivedProducts()]);
      setSuccessText("Product archived successfully.");
    } catch (err) {
      setError(extractApiError(err, "Failed to delete product"));
    }
  }

  async function handleRestoreProduct(id) {
    setError("");
    setSuccessText("");

    try {
      await restoreProduct(id);
      await Promise.all([loadProducts(), loadArchivedProducts()]);
      setSuccessText("Product restored successfully.");
    } catch (err) {
      setError(extractApiError(err, "Failed to restore product"));
    }
  }

  return (
    <div>
      <h2>{t("products.title")}</h2>
      <p className="muted">{t("products.subtitle")}</p>

      {canManage && (
        <form className="card section-gap" onSubmit={handleCreateProduct}>
          <h3>{t("products.addProduct")}</h3>
          <div className="form-grid">
            <input placeholder="SKU" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} required />
            <input placeholder={t("products.productName")} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <input placeholder={t("products.category")} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required />
            <input placeholder={t("products.batchNo")} value={form.batchNo} onChange={(e) => setForm((p) => ({ ...p, batchNo: e.target.value }))} required />
            <input placeholder={t("products.composition")} value={form.composition} onChange={(e) => setForm((p) => ({ ...p, composition: e.target.value }))} />
            <input type="number" placeholder="Cost Price" value={form.costPrice} onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))} required />
            <input type="number" placeholder={t("products.salePrice")} value={form.salePrice} onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))} required />
            <input type="number" placeholder={t("products.stockQty")} value={form.stockQty} onChange={(e) => setForm((p) => ({ ...p, stockQty: e.target.value }))} required />
            <input type="number" placeholder={t("products.reorderLevel")} value={form.reorderLevel} onChange={(e) => setForm((p) => ({ ...p, reorderLevel: e.target.value }))} required />
          </div>
          <div className="actions">
            <button type="submit" disabled={submitting}>{submitting ? t("products.saving") : t("products.createProduct")}</button>
          </div>
        </form>
      )}

      {canManage && editingId && (
        <form className="card section-gap" onSubmit={handleUpdateProduct}>
          <h3>Edit Product</h3>
          <div className="form-grid">
            <input placeholder="SKU" value={editForm.sku} onChange={(e) => setEditForm((p) => ({ ...p, sku: e.target.value }))} required />
            <input placeholder={t("products.productName")} value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required />
            <input placeholder={t("products.category")} value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} required />
            <input placeholder={t("products.batchNo")} value={editForm.batchNo} onChange={(e) => setEditForm((p) => ({ ...p, batchNo: e.target.value }))} required />
            <input placeholder={t("products.composition")} value={editForm.composition} onChange={(e) => setEditForm((p) => ({ ...p, composition: e.target.value }))} />
            <input type="number" placeholder="Cost Price" value={editForm.costPrice} onChange={(e) => setEditForm((p) => ({ ...p, costPrice: e.target.value }))} required />
            <input type="number" placeholder={t("products.salePrice")} value={editForm.salePrice} onChange={(e) => setEditForm((p) => ({ ...p, salePrice: e.target.value }))} required />
            <input type="number" placeholder={t("products.stockQty")} value={editForm.stockQty} onChange={(e) => setEditForm((p) => ({ ...p, stockQty: e.target.value }))} required />
            <input type="number" placeholder={t("products.reorderLevel")} value={editForm.reorderLevel} onChange={(e) => setEditForm((p) => ({ ...p, reorderLevel: e.target.value }))} required />
          </div>
          <div className="actions">
            <button type="button" className="ghost" onClick={() => setEditingId("")}>Cancel</button>
            <button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Update Product"}</button>
          </div>
        </form>
      )}

      {error && <p className="error-text">{error}</p>}
      {successText && <p className="success-text">{successText}</p>}

      {loading ? (
        <p className="muted">{t("products.loading")}</p>
      ) : (
        <>
          <div className="card section-gap table-enhanced-wrap">
            <div className="table-toolbar">
              <input
                className="table-search"
                placeholder="Search by SKU, name, or category"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
              />
              <p className="muted small">Showing {pagedRows.length} of {filteredSortedRows.length} active records</p>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th><button type="button" className="table-sort-btn" onClick={() => handleSort("sku")}>SKU</button></th>
                    <th><button type="button" className="table-sort-btn" onClick={() => handleSort("name")}>{t("products.productName")}</button></th>
                    <th><button type="button" className="table-sort-btn" onClick={() => handleSort("category")}>{t("products.category")}</button></th>
                    <th><button type="button" className="table-sort-btn" onClick={() => handleSort("batchNo")}>{t("products.batchNo")}</button></th>
                    <th><button type="button" className="table-sort-btn" onClick={() => handleSort("costPrice")}>Cost Price</button></th>
                    <th><button type="button" className="table-sort-btn" onClick={() => handleSort("salePrice")}>{t("products.salePrice")}</button></th>
                    <th><button type="button" className="table-sort-btn" onClick={() => handleSort("stockQty")}>{t("products.stockQty")}</button></th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.sku}</td>
                      <td>{row.name}</td>
                      <td>{row.category}</td>
                      <td>{row.batchNo}</td>
                      <td>{row.costPrice}</td>
                      <td>{row.salePrice}</td>
                      <td>{row.stockQty}</td>
                      <td>
                        {canManage ? (
                          <div className="row-actions">
                            <button type="button" className="ghost" onClick={() => beginEdit(row)}>Edit</button>
                            <button type="button" className="ghost danger-ghost" onClick={() => handleDeleteProduct(row.id)}>Delete</button>
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

          {canManage && (
            <div className="card section-gap table-enhanced-wrap">
              <div className="table-toolbar">
                <h3>Archived Products ({archivedRows.length})</h3>
                <button type="button" className="ghost" onClick={() => setShowArchived((prev) => !prev)}>
                  {showArchived ? "Hide Archived" : "Show Archived"}
                </button>
              </div>

              {showArchived && (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>{t("products.productName")}</th>
                        <th>{t("products.category")}</th>
                        <th>Cost Price</th>
                        <th>{t("products.salePrice")}</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedRows.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="muted">No archived products.</td>
                        </tr>
                      ) : (
                        archivedRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.sku}</td>
                            <td>{row.name}</td>
                            <td>{row.category}</td>
                            <td>{row.costPrice}</td>
                            <td>{row.salePrice}</td>
                            <td>
                              <button type="button" className="ghost" onClick={() => handleRestoreProduct(row.id)}>Restore</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProductsPage;
