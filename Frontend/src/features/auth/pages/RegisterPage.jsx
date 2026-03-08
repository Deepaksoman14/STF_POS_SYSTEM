import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { extractApiError } from "../../../api/client";
import { useI18n } from "../../../i18n/useI18n";
import { useAuthStore } from "../../../store/authStore";

const initialForm = {
  businessName: "",
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

        <label>{t("auth.email")}</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
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
