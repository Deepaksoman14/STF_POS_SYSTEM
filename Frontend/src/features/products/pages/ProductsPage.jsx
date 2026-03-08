import { useEffect, useState } from "react";
import { extractApiError } from "../../../api/client";
import { createProduct, fetchProducts } from "../../../api/productApi";
import DataTable from "../../../components/ui/DataTable";
import { canAccess } from "../../../app/permissions";
import { useAuthStore } from "../../../store/authStore";
import { useI18n } from "../../../i18n/useI18n";

const initialForm = {
  sku: "",
  name: "",
  category: "",
  batchNo: "",
  composition: "",
  mrp: "",
  salePrice: "",
  stockQty: "",
  reorderLevel: ""
};

function ProductsPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState("");
  const canManage = canAccess(user?.role, "products");

  async function loadProducts() {
    const data = await fetchProducts();
    setRows(
      data.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        batchNo: item.batch_no,
        composition: item.composition,
        mrp: Number(item.mrp),
        salePrice: Number(item.sale_price)
      }))
    );
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const data = await fetchProducts();
        if (!mounted) return;
        setRows(
          data.map((item) => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category,
            batchNo: item.batch_no,
            composition: item.composition,
            mrp: Number(item.mrp),
            salePrice: Number(item.sale_price)
          }))
        );
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
  }, []);

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
        mrp: Number(form.mrp),
        salePrice: Number(form.salePrice),
        stockQty: Number(form.stockQty),
        reorderLevel: Number(form.reorderLevel)
      });

      await loadProducts();
      setForm(initialForm);
      setSuccessText(t("products.success"));
    } catch (err) {
      setError(extractApiError(err, "Failed to create product"));
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: "sku", label: "SKU" },
    { key: "name", label: t("products.productName") },
    { key: "category", label: t("products.category") },
    { key: "batchNo", label: t("products.batchNo") },
    { key: "composition", label: t("products.composition") },
    { key: "mrp", label: "MRP" },
    { key: "salePrice", label: t("products.salePrice") }
  ];

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
            <input type="number" placeholder="MRP" value={form.mrp} onChange={(e) => setForm((p) => ({ ...p, mrp: e.target.value }))} required />
            <input type="number" placeholder={t("products.salePrice")} value={form.salePrice} onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))} required />
            <input type="number" placeholder={t("products.stockQty")} value={form.stockQty} onChange={(e) => setForm((p) => ({ ...p, stockQty: e.target.value }))} required />
            <input type="number" placeholder={t("products.reorderLevel")} value={form.reorderLevel} onChange={(e) => setForm((p) => ({ ...p, reorderLevel: e.target.value }))} required />
          </div>
          <div className="actions">
            <button type="submit" disabled={submitting}>{submitting ? t("products.saving") : t("products.createProduct")}</button>
          </div>
        </form>
      )}

      {error && <p className="error-text">{error}</p>}
      {successText && <p className="success-text">{successText}</p>}
      {loading ? <p className="muted">{t("products.loading")}</p> : <DataTable columns={columns} rows={rows} />}
    </div>
  );
}

export default ProductsPage;