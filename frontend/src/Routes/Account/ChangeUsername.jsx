import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { IoWarningOutline } from "react-icons/io5";
import { API_BASE_URL } from "../../services/api";
import "../Login.css";

const ChangeUsername = () => {
  const navigate = useNavigate();
  const { refetchAuth } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/users/me/display-name`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ displayName }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Update failed");
        return;
      }

      await refetchAuth();
      navigate("/profile");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1 className="login-title">Change username</h1>

      <form className="login-form" onSubmit={handleSubmit}>
        <p className="input-label">New username</p>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        {error && (
          <p className="form-error">
            <span className="form-error-icon">
              <IoWarningOutline />
            </span>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
};

export default ChangeUsername;
