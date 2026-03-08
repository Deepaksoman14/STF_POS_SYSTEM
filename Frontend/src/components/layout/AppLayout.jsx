import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { getBusinessProfile } from "../../utils/formatters";
import { canAccess, routeConfig } from "../../app/permissions";
import { useI18n } from "../../i18n/useI18n";

function AppLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useI18n();
  const profile = getBusinessProfile();
  const allowedNavItems = routeConfig.filter((item) => canAccess(user?.role, item.moduleKey));

  const businessName = user?.businessName || profile.name;
  const ownerName = user?.name || "User";
  const ownerInitial = ownerName.charAt(0).toUpperCase();
  const businessInitials = businessName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const menuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      window.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen]);

  const dateText = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(now);
  }, [now]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-chip">{t("layout.enterprise")}</span>
          <h1>POS Core</h1>
          <p className="muted">{profile.name}</p>
        </div>

        <nav>
          {allowedNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>{t(`nav.${item.labelKey}`)}</NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="muted small">{t("layout.role")}</p>
          <strong>{user?.role}</strong>
        </div>
      </aside>

      <main className="content">
        <header className="topbar card simple-topbar">
          <div className="topbar-fill">
            <div className="topbar-brand-fill">
              <div className="brand-logo-mark">{businessInitials || "BS"}</div>
              <div className="brand-fill-text">
                <p className="brand-fill-kicker">Business Workspace</p>
                <h3>{businessName}</h3>
              </div>
            </div>

            <div className="account-menu-wrap" ref={menuRef}>
              <button
                type="button"
                className="account-initial-btn"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Open account menu"
              >
                {ownerInitial}
              </button>

              {menuOpen && (
                <div className="account-popover">
                  <p className="popover-label">Logged In User</p>
                  <p className="popover-value">{ownerName.toUpperCase()}</p>

                  <p className="popover-label">Business</p>
                  <p className="popover-value">{businessName.toUpperCase()}</p>

                  <p className="popover-time">{dateText}</p>

                  <button type="button" className="ghost" onClick={handleLogout}>{t("layout.logout")}</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="page-enter">{children}</section>
      </main>
    </div>
  );
}

export default AppLayout;
