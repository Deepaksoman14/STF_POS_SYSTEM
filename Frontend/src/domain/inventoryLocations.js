export const INVENTORY_LOCATIONS = [
  { code: "main_store", label: "Main Store" },
  { code: "godown", label: "Godown" }
];

export function getLocationQty(locationStocks, code) {
  const row = (locationStocks || []).find((item) => item.location_code === code);
  return Number(row?.qty || 0);
}

export function getLocationLabel(code) {
  const matched = INVENTORY_LOCATIONS.find((item) => item.code === code);
  return matched?.label || code;
}

