import { useEffect, useMemo, useState } from "react";
import { extractApiError } from "../../../api/client";
import { createPurchaseOrder } from "../../../api/purchaseOrderApi";
import { fetchProducts } from "../../../api/productApi";
import { INVENTORY_LOCATIONS, getLocationLabel, getLocationQty } from "../../../domain/inventoryLocations";
import { useAuthStore } from "../../../store/authStore";
import { formatCurrency, getBusinessProfile } from "../../../utils/formatters";

function formatUnitLabel(unitSize, unitType) {
  if (!unitSize || (Number(unitSize) === 1 && unitType === "pcs")) return "pcs";
  return `${unitSize}${unitType}`;
}

function pickCheapestVariantId(variants) {
  if (!variants || variants.length === 0) return "";
  return [...variants]
    .sort((a, b) => (Number(a.costPrice) || 0) - (Number(b.costPrice) || 0))
    .map((variant) => variant.id)[0];
}

function mapProducts(data) {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    variants: (item.variants || []).map((variant) => ({
      id: variant.id,
      productId: item.id,
      name: item.name,
      sku: variant.sku,
      unitType: variant.unit_type || "pcs",
      unitSize: Number(variant.unit_size || 1),
      stock: Number(variant.stock_qty || 0),
      locationStocks: Array.isArray(variant.location_stocks) ? variant.location_stocks : [],
      costPrice: Number(variant.cost_price || 0)
    }))
  }));
}

function PurchaseOrdersPage({ embedded = false, modeToggle = null }) {
  const profile = getBusinessProfile();
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successText, setSuccessText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [receiveLocationCode, setReceiveLocationCode] = useState("godown");
  const [supplierName, setSupplierName] = useState("");
  const [notes, setNotes] = useState("");
  const [variantSelection, setVariantSelection] = useState({});
  const [cart, setCart] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const data = await fetchProducts();
        if (!mounted) return;

        const mappedProducts = mapProducts(data);
        setProducts(mappedProducts);
        setVariantSelection((prev) => {
          const next = { ...prev };
          mappedProducts.forEach((product) => {
            if (!next[product.id] && product.variants.length > 0) {
              next[product.id] = pickCheapestVariantId(product.variants);
            }
          });
          return next;
        });
      } catch (err) {
        if (mounted) setError(extractApiError(err, "Failed to load products"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) =>
      product.name.toLowerCase().includes(term) ||
      product.variants.some((variant) => variant.sku.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.costPrice * item.qty, 0);
  }, [cart]);

  function selectVariant(productId, variantId) {
    setVariantSelection((prev) => ({ ...prev, [productId]: variantId }));
  }

  function addToCart(variant) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === variant.id);
      if (existing) {
        return prev.map((item) => (item.id === variant.id ? { ...item, qty: item.qty + 1 } : item));
      }

      return [
        ...prev,
        {
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          unitType: variant.unitType,
          unitSize: variant.unitSize,
          costPrice: variant.costPrice,
          qty: 1
        }
      ];
    });
  }

  function updateQty(variantId, nextQty) {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== variantId));
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === variantId ? { ...item, qty: nextQty } : item)));
  }

  function clearCart() {
    setCart([]);
  }

  async function refreshProducts() {
    const data = await fetchProducts();
    const mapped = mapProducts(data);
    setProducts(mapped);
  }

  async function handleCreatePurchaseOrder() {
    if (!user || cart.length === 0) return;

    setSubmitting(true);
    setError("");
    setSuccessText("");

    try {
      const payload = {
        supplierName: supplierName.trim(),
        receiveLocationCode,
        paymentMode,
        notes,
        createdBy: user.name,
        items: cart.map((item) => ({ variantId: item.id, qty: item.qty }))
      };

      const purchase = await createPurchaseOrder(payload);
      const billNo = purchase.purchase_no || purchase.id;
      setSuccessText(`Purchase order created. Bill #${billNo}`);
      clearCart();
      setSupplierName("");
      setNotes("");

      await refreshProducts();
    } catch (err) {
      setError(extractApiError(err, "Failed to create purchase order"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pos-workspace split-layout">
      <section>
        <div className="pos-header-row">
          <div>
            <h2>{embedded ? "Billing Counter" : "Purchase Orders"}</h2>
            <p className="muted">
              {embedded ? "Search by product or SKU and bill faster." : "Record wholesale buying and increase stock in one flow."}
            </p>
            {embedded && modeToggle}
          </div>
          <div className="pos-quick-stats card compact">
            <p className="small muted">Items in order</p>
            <strong>{cart.length}</strong>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
        {successText && <p className="success-text">{successText}</p>}

        <div className="card compact pos-search-wrap">
          <input
            type="text"
            placeholder="Search products by name or SKU"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {loading ? (
          <p className="muted">Loading products...</p>
        ) : (
          <div className="product-grid pos-product-grid">
            {filteredProducts.map((product) => {
              const selectedVariantId = variantSelection[product.id] || pickCheapestVariantId(product.variants);
              const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) || product.variants[0];

              return (
                <article key={product.id} className="card compact pos-product-card">
                  <div>
                    <h4>{product.name}</h4>
                    <p className="muted small">{product.category}</p>
                  </div>

                  <div className="variant-picker">
                    {product.variants.map((variant) => {
                      const unitLabel = formatUnitLabel(variant.unitSize, variant.unitType);
                      const isActive = variant.id === selectedVariantId;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          className={`variant-pill${isActive ? " active" : ""}`}
                          onClick={() => selectVariant(product.id, variant.id)}
                        >
                          {unitLabel}
                        </button>
                      );
                    })}
                  </div>

                  {selectedVariant && (
                    <div className="variant-summary">
                      <p className="muted small">
                        SKU {selectedVariant.sku} - Stock ({getLocationLabel(receiveLocationCode)}) {getLocationQty(selectedVariant.locationStocks, receiveLocationCode)}
                      </p>
                      <div className="variant-actions">
                        <span>{formatCurrency(selectedVariant.costPrice, profile.currency, profile.locale)}</span>
                        <button onClick={() => addToCart(selectedVariant)}>Add</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="card pos-bill-card">
        <h3>Current Purchase Order</h3>

        {cart.length === 0 && <p className="muted">No items added.</p>}
        {cart.map((item) => (
          <div key={item.id} className="line-item pos-line-item">
            <div>
              <p>{item.name}</p>
              <p className="muted small">{formatUnitLabel(item.unitSize, item.unitType)} - {formatCurrency(item.costPrice, profile.currency, profile.locale)} each</p>
            </div>

            <div className="qty-stepper">
              <button type="button" className="ghost" onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
              <span>{item.qty}</span>
              <button type="button" className="ghost" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
            </div>

            <strong>{formatCurrency(item.qty * item.costPrice, profile.currency, profile.locale)}</strong>
          </div>
        ))}

        <div className="pos-checkout-config">
          <label>Supplier Name</label>
          <input
            type="text"
            placeholder="Optional supplier name"
            value={supplierName}
            onChange={(event) => setSupplierName(event.target.value)}
          />

          <label>Receive To</label>
          <select value={receiveLocationCode} onChange={(event) => setReceiveLocationCode(event.target.value)}>
            {INVENTORY_LOCATIONS.map((location) => (
              <option key={location.code} value={location.code}>{location.label}</option>
            ))}
          </select>

          <label>Payment Mode</label>
          <select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="credit">Credit</option>
          </select>

          <label>Notes</label>
          <input
            type="text"
            placeholder="Optional purchase notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <hr />
        <div className="line-item pos-total-line grand-total">
          <strong>Total</strong>
          <strong>{formatCurrency(subtotal, profile.currency, profile.locale)}</strong>
        </div>

        <div className="actions">
          <button className="ghost" onClick={clearCart}>Clear</button>
          <button disabled={cart.length === 0 || submitting} onClick={handleCreatePurchaseOrder}>
            {submitting ? "Processing..." : "Create Purchase Order"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default PurchaseOrdersPage;
