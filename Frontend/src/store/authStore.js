import { create } from "zustand";
import { loginRequest, registerRequest } from "../api/authApi";

function mapUser(apiUser) {
  return {
    id: apiUser.id,
    businessId: apiUser.business_id,
    businessName: apiUser.business_name,
    name: apiUser.full_name,
    role: apiUser.role,
    email: apiUser.email
  };
}

function persistSession(data, set) {
  const mappedUser = mapUser(data.user);
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("authUser", JSON.stringify(mappedUser));
  set({ user: mappedUser });
}

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("authUser") || "null"),
  login: async ({ email, password }) => {
    const data = await loginRequest({ email, password });
    persistSession(data, set);
  },
  register: async ({ businessName, fullName, email, password }) => {
    return registerRequest({ businessName, fullName, email, password });
  },
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    set({ user: null });
  }
}));
