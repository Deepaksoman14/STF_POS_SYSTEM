const fertilizerProfile = {
  id: "fertilizer-retail",
  name: "Fertilizer Shop",
  currency: "INR",
  locale: "en-IN",
  modules: {
    dashboard: true,
    sales: true,
    products: true,
    inventory: true,
    customers: true,
    reports: true,
    settings: true
  },
  productSchema: [
    { key: "sku", label: "SKU", required: true },
    { key: "name", label: "Product Name", required: true },
    { key: "category", label: "Category", required: true },
    { key: "batchNo", label: "Batch Number", required: true },
    { key: "composition", label: "NPK Composition", required: false },
    { key: "mrp", label: "MRP", required: true },
    { key: "salePrice", label: "Sale Price", required: true }
  ]
};

export const businessProfiles = {
  "fertilizer-retail": fertilizerProfile
};

export const defaultBusinessProfileId = "fertilizer-retail";