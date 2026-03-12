import { defaultBusinessProfileId, businessProfiles } from "../domain/businessProfiles";

export function getBusinessProfile() {
  const stored = localStorage.getItem("businessProfileId") || defaultBusinessProfileId;
  return businessProfiles[stored] || businessProfiles[defaultBusinessProfileId];
}

export function formatCurrency(amount, currency = "INR", locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amount || 0);
}
