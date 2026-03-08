import { useEffect, useMemo, useState } from "react";
import { extractApiError } from "../../../api/client";
import { fetchProducts } from "../../../api/productApi";
import { createSale } from "../../../api/salesApi";
import { useI18n } from "../../../i18n/useI18n";
import { useAuthStore } from "../../../store/authStore";
import { usePosStore } from "../../../store/posStore";
import { formatCurrency, getBusinessProfile } from "../../../utils/formatters";

function POSPage() {
  const profile = getBusinessProfile();
  const { t } = useI18n();
  const { user } = useAuthStore();
  const { cart, addToCart, updateQty, clearCart } = usePosStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const data = await fetchProducts();
        if (!mounted) return;

        setProducts(
          data.map((item) => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            stock: item.stock_qty,
            salePrice: Number(item.sale_price)
          }))
        );
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, "Failed to load products"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.salePrice * item.qty, 0);
  }, [cart]);

  async function handleCheckout() {
    if (cart.length === 0 || !user) return;

    setSubmitting(true);
    setError("");
    setSuccessText("");

    try {
      const payload = {
        paymentMode: "cash",
        discount: 0,
        notes: "",
        createdBy: user.name,
        items: cart.map((item) => ({ productId: item.id, qty: item.qty }))
      };

      const sale = await createSale(payload);
      const billNo = sale.bill_no || sale.bill_no === 0 ? sale.bill_no : sale.id;
      setSuccessText(t("pos.saleCreated", { billNo }));
      clearCart();

      const refreshed = await fetchProducts();
      setProducts(
        refreshed.map((item) => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          stock: item.stock_qty,
          salePrice: Number(item.sale_price)
        }))
      );
    } catch (err) {
      setError(extractApiError(err, "Checkout failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="split-layout">
      <section>
        <h2>{t("pos.title")}</h2>
        {error && <p className="error-text">{error}</p>}
        {successText && <p className="success-text">{successText}</p>}
        {loading ? (
          <p className="muted">{t("pos.loadingProducts")}</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article key={product.id} className="card compact">
                <h4>{product.name}</h4>
                <p className="muted">{product.sku} | {t("pos.stock")}: {product.stock}</p>
                <strong>{formatCurrency(product.salePrice, profile.currency, profile.locale)}</strong>
                <button onClick={() => addToCart(product)} disabled={product.stock <= 0}>{t("pos.add")}</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h3>{t("pos.currentBill")}</h3>
        {cart.length === 0 && <p className="muted">{t("pos.noItems")}</p>}
        {cart.map((item) => (
          <div key={item.id} className="line-item">
            <span>{item.name}</span>
            <input
              type="number"
              min="1"
              value={item.qty}
              onChange={(e) => updateQty(item.id, Number(e.target.value))}
            />
            <span>{formatCurrency(item.qty * item.salePrice, profile.currency, profile.locale)}</span>
          </div>
        ))}
        <hr />
        <div className="line-item">
          <strong>{t("pos.total")}</strong>
          <strong>{formatCurrency(total, profile.currency, profile.locale)}</strong>
        </div>
        <div className="actions">
          <button className="ghost" onClick={clearCart}>{t("pos.clear")}</button>
          <button disabled={cart.length === 0 || submitting} onClick={handleCheckout}>
            {submitting ? t("pos.processing") : t("pos.checkout")}
          </button>
        </div>
      </section>
    </div>
  );
}

export default POSPage;