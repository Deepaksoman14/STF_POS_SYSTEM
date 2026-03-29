import { query } from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";

const TEMPLATE_DEFAULTS = [
  {
    template_key: "classic_invoice",
    name: "Classic Invoice",
    description: "Traditional invoice format with ruled rows and terms footer."
  },
  {
    template_key: "modern_invoice",
    name: "Modern Invoice",
    description: "Clean modern bill layout for A4 print."
  },
  {
    template_key: "thermal_80mm",
    name: "Thermal 80mm",
    description: "Compact receipt style for thermal printers."
  }
];

const DEFAULT_BILL_PROFILE = {
  businessName: "Soman Tech Foundry",
  businessDescription: "Dealers: Seeds, Fertilisers & Agro Chemicals",
  address: "",
  city: "",
  tinNo: "",
  cstNo: "",
  welNo: "",
  plNo: "",
  slNo: "",
  gstin: "",
  termsAndConditions: "Interest at 24% per annum will be charged if payment is not received within due date.\nSubject to Dindigul jurisdiction.\nGoods once sold cannot be taken back.",
  disclaimer: "",
  wholesalePaperSize: "A4"
};

async function ensureTemplateCatalog() {
  for (const template of TEMPLATE_DEFAULTS) {
    await query(
      `INSERT INTO print_template (template_key, name, description, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (template_key) DO NOTHING`,
      [template.template_key, template.name, template.description]
    );
  }
}

async function ensureBusinessSettingSchema() {
  await query(
    `ALTER TABLE business_setting
     ADD COLUMN IF NOT EXISTS bill_profile JSONB NOT NULL DEFAULT '{}'::jsonb`
  );
}

function normalizeBillProfile(input) {
  return {
    ...DEFAULT_BILL_PROFILE,
    ...(input || {})
  };
}

export async function listPrintTemplates() {
  await ensureTemplateCatalog();
  const result = await query(
    `SELECT template_key, name, description
     FROM print_template
     WHERE is_active = true
     ORDER BY name`
  );
  return result.rows;
}

export async function getCurrentPrintTemplate(businessId) {
  await ensureTemplateCatalog();
  await ensureBusinessSettingSchema();

  const result = await query(
    `SELECT bs.print_template_key, bs.bill_profile
     FROM business_setting bs
     JOIN print_template pt ON pt.template_key = bs.print_template_key
     WHERE bs.business_id = $1 AND pt.is_active = true`,
    [businessId]
  );

  if (result.rowCount > 0) {
    return {
      templateKey: result.rows[0].print_template_key,
      billProfile: normalizeBillProfile(result.rows[0].bill_profile)
    };
  }

  return {
    templateKey: "classic_invoice",
    billProfile: normalizeBillProfile()
  };
}

export async function setCurrentPrintTemplate(businessId, templateKey, billProfile) {
  await ensureTemplateCatalog();
  await ensureBusinessSettingSchema();

  const templateRes = await query(
    `SELECT template_key
     FROM print_template
     WHERE template_key = $1 AND is_active = true`,
    [templateKey]
  );

  if (templateRes.rowCount === 0) {
    throw new ApiError(400, "Invalid print template key");
  }

  await query(
    `INSERT INTO business_setting (business_id, print_template_key, bill_profile, updated_at)
     VALUES ($1, $2, $3::jsonb, NOW())
     ON CONFLICT (business_id)
     DO UPDATE SET print_template_key = EXCLUDED.print_template_key,
                   bill_profile = EXCLUDED.bill_profile,
                   updated_at = NOW()`,
    [businessId, templateKey, JSON.stringify(normalizeBillProfile(billProfile))]
  );

  return {
    templateKey,
    billProfile: normalizeBillProfile(billProfile)
  };
}
