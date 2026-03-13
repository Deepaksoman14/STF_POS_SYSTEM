import { useState } from "react";
import { useI18n } from "../../../i18n/useI18n";
import { getBusinessProfile } from "../../../utils/formatters";
import { useAuthStore } from "../../../store/authStore";

const currencyOptions = ["INR", "USD", "EUR", "GBP"];
const localeOptions = ["en-IN", "en-US", "ta-IN"];

function SettingsPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const profile = getBusinessProfile();
  const [form, setForm] = useState({
    currency: profile.currency,
    locale: profile.locale
  });
  const [savedText, setSavedText] = useState("");

  function handleSave() {
    localStorage.setItem(
      "businessProfileOverride",
      JSON.stringify({
        currency: form.currency,
        locale: form.locale
      })
    );
    setSavedText(t("settings.saved"));
  }

  function handleReset() {
    localStorage.removeItem("businessProfileOverride");
    setForm({
      currency: profile.currency,
      locale: profile.locale
    });
    setSavedText(t("settings.resetDone"));
  }

  return (
    <div>
      <h2>{t("settings.title")}</h2>
      <p className="muted">{t("settings.subtitle")}</p>

      <div className="settings-grid">
        <div className="card">
          <h3>{t("settings.profileInfo")}</h3>
          <p><strong>{t("settings.businessName")}:</strong> {user?.businessName || "-"}</p>
          <p><strong>{t("settings.businessProfile")}:</strong> {profile.name}</p>
          <p className="muted small">{t("settings.profileHint")}</p>
        </div>

        <div className="card">
          <h3>{t("settings.displaySettings")}</h3>
          <div className="form-grid">
            <select
              value={form.currency}
              onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))}
            >
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
            <select
              value={form.locale}
              onChange={(event) => setForm((prev) => ({ ...prev, locale: event.target.value }))}
            >
              {localeOptions.map((locale) => (
                <option key={locale} value={locale}>{locale}</option>
              ))}
            </select>
          </div>
          <div className="settings-actions">
            <button type="button" className="ghost" onClick={handleReset}>{t("settings.reset")}</button>
            <button type="button" onClick={handleSave}>{t("settings.save")}</button>
          </div>
          {savedText && <p className="success-text">{savedText}</p>}
          <p className="muted small">{t("settings.localOnly")}</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
