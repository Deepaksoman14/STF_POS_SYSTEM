import { create } from "zustand";

export const usePosStore = create((set, get) => ({
  cart: [],
  addToCart: (product) => {
    const cart = get().cart;
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      set({
        cart: cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      });
      return;
    }

    set({
      cart: [
        ...cart,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          salePrice: Number(product.salePrice),
          qty: 1
        }
      ]
    });
  },
  updateQty: (id, qty) => {
    if (qty <= 0) {
      set({ cart: get().cart.filter((item) => item.id !== id) });
      return;
    }

    set({
      cart: get().cart.map((item) => (item.id === id ? { ...item, qty } : item))
    });
  },
  clearCart: () => set({ cart: [] })
}));