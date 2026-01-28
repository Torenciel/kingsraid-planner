import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoWarningOutline } from "react-icons/io5";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Temporary success behavior (session comes next)
      navigate("/");
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
          // placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <p className="input-label">Password</p>
        <input
          type="password"
          name="password"
          // placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {error && <p className="form-error"><span className="form-error-icon"><IoWarningOutline /></span> {error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="form-link">
        Don't have an account? <Link className="form-link-label" to="/register">Register</Link>
      </p>
      <p className="form-link">
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
    </div>
  );
};

export default Login;
