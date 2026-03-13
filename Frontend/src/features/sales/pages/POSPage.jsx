import { useEffect, useMemo, useState } from "react";
import { extractApiError } from "../../../api/client";
import { fetchCustomers } from "../../../api/customerApi";
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
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successText, setSuccessText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        const [productsData, customersData] = await Promise.all([
          fetchProducts(),
          fetchCustomers()
        ]);
        if (!mounted) return;

        setProducts(
          productsData.map((item) => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            stock: item.stock_qty,
            salePrice: Number(item.sale_price)
          }))
        );

        setCustomers(
          customersData.map((item) => ({
            id: item.id,
            name: item.name,
            address: item.address || "",
            mobile: item.mobile || "",
            email: item.email || ""
          }))
        );
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, "Failed to load POS data"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      mounted = false;
    };
  }, []);

  const cartQtyByProduct = useMemo(() => {
    return cart.reduce((acc, item) => {
      acc[item.id] = item.qty;
      return acc;
    }, {});
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) =>
      product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const customerMatches = useMemo(() => {
    const term = customerName.trim().toLowerCase();
    if (!term) return customers.slice(0, 6);

    return customers
      .filter((customer) => (
        customer.name.toLowerCase().includes(term) ||
        customer.mobile.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
      ))
      .slice(0, 6);
  }, [customerName, customers]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.salePrice * item.qty, 0), [cart]);
  const safeDiscount = Math.min(Number(discount) || 0, subtotal);
  const total = Math.max(subtotal - safeDiscount, 0);

  function getCartQty(productId) {
    return cartQtyByProduct[productId] || 0;
  }

  function handleAdd(product) {
    if (getCartQty(product.id) >= product.stock) return;
    addToCart(product);
  }

  function increaseQty(item) {
    const sourceProduct = products.find((product) => product.id === item.id);
    if (!sourceProduct) return;
    if (item.qty >= sourceProduct.stock) return;
    updateQty(item.id, item.qty + 1);
  }

  function decreaseQty(item) {
    updateQty(item.id, item.qty - 1);
  }

  function handleCustomerInputChange(value) {
    setCustomerName(value);

    const normalized = value.trim().toLowerCase();
    const exactMatch = customers.find((customer) => (
      customer.name.trim().toLowerCase() === normalized ||
      customer.mobile.trim().toLowerCase() === normalized ||
      customer.email.trim().toLowerCase() === normalized
    ));

    if (exactMatch) {
      setSelectedCustomerId(exactMatch.id);
      setCustomerName(exactMatch.name);
      setCustomerMenuOpen(false);
      return;
    }

    setSelectedCustomerId("");
    if (!customerMenuOpen) {
      setCustomerMenuOpen(true);
    }
  }

  function selectCustomer(customer) {
    setCustomerName(customer.name);
    setSelectedCustomerId(customer.id);
    setCustomerMenuOpen(false);
  }

  async function refreshCustomers() {
    const customersData = await fetchCustomers();
    setCustomers(
      customersData.map((item) => ({
        id: item.id,
        name: item.name,
        address: item.address || "",
        mobile: item.mobile || "",
        email: item.email || ""
      }))
    );
  }

  async function refreshProducts() {
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
  }

  async function handleCheckout() {
    if (cart.length === 0 || !user) return;

    setSubmitting(true);
    setError("");
    setSuccessText("");

    try {
      const payload = {
        paymentMode,
        discount: safeDiscount,
        notes,
        createdBy: user.name,
        items: cart.map((item) => ({ productId: item.id, qty: item.qty }))
      };

      if (selectedCustomerId) {
        payload.customerId = selectedCustomerId;
      } else if (customerName.trim()) {
        payload.customer = { name: customerName.trim() };
      }

      const sale = await createSale(payload);
      const billNo = sale.bill_no || sale.bill_no === 0 ? sale.bill_no : sale.id;
      setSuccessText(t("pos.saleCreated", { billNo }));
      clearCart();
      setDiscount(0);
      setNotes("");
      setCustomerName("");
      setSelectedCustomerId("");

      await Promise.all([refreshProducts(), refreshCustomers()]);
    } catch (err) {
      setError(extractApiError(err, "Checkout failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pos-workspace split-layout">
      <section>
        <div className="pos-header-row">
          <div>
            <h2>{t("pos.title")}</h2>
            <p className="muted">Search by product or SKU and bill faster.</p>
          </div>
          <div className="pos-quick-stats card compact">
            <p className="small muted">Items in cart</p>
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
          <p className="muted">{t("pos.loadingProducts")}</p>
        ) : (
          <div className="product-grid pos-product-grid">
            {filteredProducts.map((product) => {
              const cartQty = getCartQty(product.id);
              const canAdd = product.stock > 0 && cartQty < product.stock;

              return (
                <article key={product.id} className="card compact pos-product-card">
                  <div>
                    <h4>{product.name}</h4>
                    <p className="muted small">{product.sku}</p>
                  </div>
                  <p className="muted small">{t("pos.stock")}: {product.stock} | In Bill: {cartQty}</p>
                  <strong>{formatCurrency(product.salePrice, profile.currency, profile.locale)}</strong>
                  <button onClick={() => handleAdd(product)} disabled={!canAdd}>
                    {canAdd ? t("pos.add") : "Stock Limit"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="card pos-bill-card">
        <h3>{t("pos.currentBill")}</h3>

        {cart.length === 0 && <p className="muted">{t("pos.noItems")}</p>}
        {cart.map((item) => (
          <div key={item.id} className="line-item pos-line-item">
            <div>
              <p>{item.name}</p>
              <p className="muted small">{formatCurrency(item.salePrice, profile.currency, profile.locale)} each</p>
            </div>

            <div className="qty-stepper">
              <button type="button" className="ghost" onClick={() => decreaseQty(item)}>-</button>
              <span>{item.qty}</span>
              <button type="button" className="ghost" onClick={() => increaseQty(item)}>+</button>
            </div>

            <strong>{formatCurrency(item.qty * item.salePrice, profile.currency, profile.locale)}</strong>
          </div>
        ))}

        <div className="pos-checkout-config">
          <label>Customer Name</label>
          <div className="combo-box">
            <input
              type="text"
              placeholder="Search name, mobile, or email"
              value={customerName}
              onChange={(event) => handleCustomerInputChange(event.target.value)}
              onFocus={() => setCustomerMenuOpen(true)}
              onBlur={() => setTimeout(() => setCustomerMenuOpen(false), 120)}
            />
            {customerMenuOpen && customerMatches.length > 0 && (
              <div className="combo-menu">
                {customerMatches.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    className="combo-option"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectCustomer(customer);
                    }}
                  >
                    <span className="combo-title">{customer.name}</span>
                    <span className="combo-sub">{customer.mobile || "-"} • {customer.email || "-"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <label>Payment Mode</label>
          <select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="credit">Credit</option>
          </select>

          <label>Discount</label>
          <input
            type="number"
            min="0"
            max={subtotal}
            value={discount}
            onChange={(event) => setDiscount(Number(event.target.value) || 0)}
          />

          <label>Notes</label>
          <input
            type="text"
            placeholder="Optional bill notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <hr />
        <div className="line-item pos-total-line">
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal, profile.currency, profile.locale)}</strong>
        </div>
        <div className="line-item pos-total-line">
          <span>Discount</span>
          <strong>{formatCurrency(safeDiscount, profile.currency, profile.locale)}</strong>
        </div>
        <div className="line-item pos-total-line grand-total">
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
