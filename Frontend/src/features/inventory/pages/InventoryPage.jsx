import { useEffect, useState } from "react";
import { extractApiError } from "../../../api/client";
import { fetchProducts } from "../../../api/productApi";
import DataTable from "../../../components/ui/DataTable";
import { useI18n } from "../../../i18n/useI18n";

function InventoryPage() {
  const { t, language } = useI18n();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadInventory() {
      try {
        const data = await fetchProducts();
        if (!mounted) return;

        setRows(
          data.map((item) => ({
            id: item.id,
            sku: item.sku,
            product: item.name,
            stock: item.stock_qty,
            reorderLevel: item.reorder_level,
            warehouse: t("inventory.main")
          }))
        );
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, "Failed to load inventory"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInventory();

    return () => {
      mounted = false;
    };
  }, [language]);

  const columns = [
    { key: "sku", label: t("inventory.sku") },
    { key: "product", label: t("inventory.product") },
    { key: "stock", label: t("inventory.inStock") },
    { key: "reorderLevel", label: t("inventory.reorderLevel") },
    { key: "warehouse", label: t("inventory.warehouse") }
  ];

  return (
    <div>
      <h2>{t("inventory.title")}</h2>
      <p className="muted">{t("inventory.subtitle")}</p>
      {error && <p className="error-text">{error}</p>}
      {loading ? <p className="muted">{t("inventory.loading")}</p> : <DataTable columns={columns} rows={rows} />}
    </div>
  );
}

export default InventoryPage;