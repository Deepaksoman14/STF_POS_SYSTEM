import { useEffect, useMemo, useState } from "react";
import { extractApiError } from "../../../api/client";
import { fetchUsers, updateUserAccess } from "../../../api/userApi";
import { useAuthStore } from "../../../store/authStore";

const roles = ["admin", "owner", "viewer"];

function ConfigurationPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      try {
        const data = await fetchUsers();
        if (!mounted) return;

        setUsers(data);
        setDrafts(
          data.reduce((acc, item) => {
            acc[item.id] = { role: item.role, isActive: item.is_active };
            return acc;
          }, {})
        );
      } catch (err) {
        if (mounted) setError(extractApiError(err, "Failed to load users"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.email === currentUser?.email) return -1;
      if (b.email === currentUser?.email) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [users, currentUser?.email]);

  async function handleSave(userId) {
    setSavingId(userId);
    setError("");
    setSuccess("");

    try {
      const updated = await updateUserAccess(userId, drafts[userId]);
      setUsers((prev) => prev.map((item) => (item.id === userId ? updated : item)));
      setSuccess("User access updated successfully.");
    } catch (err) {
      setError(extractApiError(err, "Failed to update user"));
    } finally {
      setSavingId("");
    }
  }

  function patchDraft(userId, patch) {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        ...patch
      }
    }));
  }

  return (
    <div>
      <h2>Configuration</h2>
      <p className="muted">Admin-only control for role assignment and account visibility.</p>
      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      {loading ? (
        <p className="muted">Loading users...</p>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Visible / Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((item) => {
                const draft = drafts[item.id] || { role: item.role, isActive: item.is_active };
                const isSelf = item.email === currentUser?.email;

                return (
                  <tr key={item.id}>
                    <td>{item.full_name}</td>
                    <td>{item.email}</td>
                    <td>
                      <select
                        value={draft.role}
                        onChange={(event) => patchDraft(item.id, { role: event.target.value })}
                        disabled={savingId === item.id}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label className="toggle-inline">
                        <input
                          type="checkbox"
                          checked={Boolean(draft.isActive)}
                          onChange={(event) => patchDraft(item.id, { isActive: event.target.checked })}
                          disabled={savingId === item.id || isSelf}
                        />
                        <span>{draft.isActive ? "Active" : "Disabled"}</span>
                      </label>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleSave(item.id)}
                        disabled={savingId === item.id}
                      >
                        {savingId === item.id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ConfigurationPage;
