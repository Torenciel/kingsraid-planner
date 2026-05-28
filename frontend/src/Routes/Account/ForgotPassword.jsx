import { useState } from "react";
import { Link } from "react-router-dom";
import { IoWarningOutline } from "react-icons/io5";
import { API_BASE_URL } from "../../services/api";
import "../Login.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      setMessage(
        "If an account exists with this email, a reset link has been sent."
      );
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1 className="login-title">Forgot Password</h1>

      <form className="login-form" onSubmit={handleSubmit}>
        <p className="input-label">Email</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

        {message && (
          <p className="form-error" style={{ backgroundColor: "var(--color-validation-default)" }}>
            {message}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="form-link">
        <Link to="/login" className="form-link-label">
          Back to login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
