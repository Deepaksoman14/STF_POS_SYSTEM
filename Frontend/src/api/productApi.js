import api from "./client";

export async function fetchProducts() {
  const response = await api.get("/products");
  return response.data.data;
}

export async function createProduct(payload) {
  const response = await api.post("/products", payload);
  return response.data.data;
}