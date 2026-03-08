import api from "./client";

export async function fetchCustomers() {
  const response = await api.get("/customers");
  return response.data.data;
}

export async function createCustomer(payload) {
  const response = await api.post("/customers", payload);
  return response.data.data;
}