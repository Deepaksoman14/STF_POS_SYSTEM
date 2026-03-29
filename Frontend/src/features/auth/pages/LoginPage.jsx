import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { extractApiError } from "../../../api/client";
import { useI18n } from "../../../i18n/useI18n";
import { useAuthStore } from "../../../store/authStore";

const COPYRIGHT_TEXT = `Copyright © ${new Date().getFullYear()} Soman Tech Foundry. All rights reserved.`;

function LoginPage() {
  const { login } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const approvedMessage = useMemo(() => {
    return searchParams.get("approved") === "1"
      ? "Signup approved. The client can now login with registered credentials."
      : "";
  }, [searchParams]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
      navigate("/app");
    } catch (err) {
      setError(extractApiError(err, "Unable to login"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="centered">
      <form className="card" onSubmit={handleSubmit}>
        <h2>{t("auth.loginTitle")}</h2>
        <p className="muted">{t("auth.loginSubtitle")}</p>
        {approvedMessage && <p className="success-text">{approvedMessage}</p>}
        <label>{t("auth.email")}</label>
        <input
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
          type="email"
        />
        <label>{t("auth.password")}</label>
        <input
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
          type="password"
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? t("auth.signingIn") : t("auth.signIn")}</button>
        <p className="auth-switch">{t("auth.newBusiness")} <Link to="/register">{t("auth.createOwner")}</Link></p>
        <p className="app-copyright auth-copy">{COPYRIGHT_TEXT}</p>
      </form>
    </div>
  );
}

export default LoginPage;
