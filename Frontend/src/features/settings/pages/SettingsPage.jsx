import { useI18n } from "../../../i18n/useI18n";
import { getBusinessProfile } from "../../../utils/formatters";

function SettingsPage() {
  const profile = getBusinessProfile();
  const { t } = useI18n();

  return (
    <div>
      <h2>{t("settings.title")}</h2>
      <div className="card">
        <h3>{t("settings.businessProfile")}</h3>
        <p><strong>{t("settings.name")}:</strong> {profile.name}</p>
        <p><strong>{t("settings.currency")}:</strong> {profile.currency}</p>
        <p><strong>{t("settings.locale")}:</strong> {profile.locale}</p>
        <p className="muted">{t("settings.futureOnboarding")}</p>
      </div>
    </div>
  );
}

export default SettingsPage;