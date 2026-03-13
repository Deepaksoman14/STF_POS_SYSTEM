import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { extractApiError } from "../../../api/client";
import { useI18n } from "../../../i18n/useI18n";
import { businessProfiles, defaultBusinessProfileId } from "../../../domain/businessProfiles";
import { useAuthStore } from "../../../store/authStore";

const ADMIN_EMAIL = "somandeepak14@gmail.com";

const initialForm = {
  businessName: "",
  businessProfileId: defaultBusinessProfileId,
  fullName: "",
  email: "",
  password: ""
};

function RegisterPage() {
  const { register } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAdminSignup, setIsAdminSignup] = useState(false);

  useEffect(() => {
    const isAdminEmail = form.email.trim().toLowerCase() === ADMIN_EMAIL;
    setIsAdminSignup(isAdminEmail);
    if (isAdminEmail) {
      setForm((prev) => ({ ...prev, businessProfileId: defaultBusinessProfileId }));
    }
  }, [form.email]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await register(form);
      setSuccess(data.message || "Signup request submitted for approval.");
      setForm(initialForm);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(extractApiError(err, "Unable to register"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="centered">
      <form className="card" onSubmit={handleSubmit}>
        <h2>{t("auth.registerTitle")}</h2>
        <p className="muted">{t("auth.registerSubtitle")}</p>

        <label>{t("auth.email")}</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
        />

        {isAdminSignup && (
          <div className="card compact">
            <strong>{t("auth.adminNoticeTitle")}</strong>
            <p className="muted small">{t("auth.adminNoticeBody")}</p>
          </div>
        )}

        <label>{t("auth.businessProfile")}</label>
        <select
          value={form.businessProfileId}
          onChange={(event) => setForm((prev) => ({ ...prev, businessProfileId: event.target.value }))}
          disabled={isAdminSignup}
        >
          {Object.entries(businessProfiles).map(([key, profile]) => (
            <option key={key} value={key}>{profile.name}</option>
          ))}
        </select>

        <label>{t("auth.businessName")}</label>
        <input
          value={form.businessName}
          onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
          required
        />

        <label>{t("auth.ownerName")}</label>
        <input
          value={form.fullName}
          onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          required
        />

        <label>{t("auth.password")}</label>
        <input
          type="password"
          minLength="6"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}
        <button type="submit" disabled={loading}>{loading ? t("auth.creating") : t("auth.createAccount")}</button>
        <p className="auth-switch">{t("auth.alreadyHaveAccount")} <Link to="/login">{t("common.signIn")}</Link></p>
      </form>
    </div>
  );
}

export default RegisterPage;
