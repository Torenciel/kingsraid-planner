import { useState } from "react";
import { IoWarningOutline } from "react-icons/io5";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { refetchAuth } = useAuth();

  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    setError(null);
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const res = await fetch("http://localhost:3002/api/v2/oauth/google/url");
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to start Google login");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3002/api/v2/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // REQUIRED for JWT cookies
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Temporary success behavior (session comes next)
      await refetchAuth();
      navigate(from, { replace: true });
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1 className="login-title">Log in</h1>

      <form className="login-form" onSubmit={handleSubmit}>
        <p className="input-label">Email</p>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <p className="input-label">Password</p>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {error && (
          <p className="form-error">
            <span className="form-error-icon">
              <IoWarningOutline />
            </span>{" "}
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          margin: "1.5rem 0",
        }}
      >
        <div
          style={{
            flex: 1,
            height: "1px",
            background: "var(--color-border-default)",
          }}
        ></div>
        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
          or
        </span>
        <div
          style={{
            flex: 1,
            height: "1px",
            background: "var(--color-border-default)",
          }}
        ></div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        style={{
          width: "100%",
          padding: "0.75rem",
          background: "var(--color-primary-default)",
          color: "var(--color-text-default)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "4px",
          cursor: googleLoading ? "not-allowed" : "pointer",
          fontSize: "1rem",
          opacity: googleLoading ? 0.6 : 1,
        }}
      >
        {googleLoading ? "Redirecting..." : "Login with Google"}
      </button>

      <p className="form-link">
        Don't have an account?{" "}
        <Link className="form-link-label" to="/register">
          Register
        </Link>
      </p>
      <p className="form-link">
        <Link className="form-link-text" to="/forgot-password">
          Forgot your password?
        </Link>
      </p>
    </div>
  );
};

export default Login;
