// frontend/src/Routes/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { IoWarningOutline } from "react-icons/io5";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const { refetchAuth } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });

  const DISPLAY_NAME_MIN = 3;
  const DISPLAY_NAME_MAX = 20;

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const PASSWORD_RULES = {
    minLength: 8,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*(),.?":{}|<>]/,
  };

  const [touched, setTouched] = useState({});

  const allFieldsTouched =
  touched.email &&
  touched.displayName &&
  touched.password &&
  touched.confirmPassword;


  const [errors, setErrors] = useState({});

  const validate = (data) => {
    const newErrors = {};

    // Display name
    if (
      data.displayName.length < DISPLAY_NAME_MIN ||
      data.displayName.length > DISPLAY_NAME_MAX
    ) {
      newErrors.displayName =
        `Username must be between ${DISPLAY_NAME_MIN} and ${DISPLAY_NAME_MAX} characters`;
    }

    // Email
    if (!EMAIL_REGEX.test(data.email)) {
      newErrors.email = "Invalid email address";
    }

    // Password
    if (data.password.length < PASSWORD_RULES.minLength) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!PASSWORD_RULES.uppercase.test(data.password)) {
      newErrors.password = "Password must contain an uppercase letter";
    } else if (!PASSWORD_RULES.lowercase.test(data.password)) {
      newErrors.password = "Password must contain a lowercase letter";
    } else if (!PASSWORD_RULES.number.test(data.password)) {
      newErrors.password = "Password must contain a number";
    } else if (!PASSWORD_RULES.special.test(data.password)) {
      newErrors.password = "Password must contain a special character";
    }

    // Confirm password
    if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };


  const [loading, setLoading] = useState(false);

  const isFormValid = Object.keys(errors).length === 0;

  const canSubmit = allFieldsTouched && isFormValid && !loading;

  const handleChange = (e) => {
    const updatedFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };

    setFormData(updatedFormData);
    setErrors(validate(updatedFormData));
  };
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({
        email: true,
        displayName: true,
        password: true,
        confirmPassword: true,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3002/api/v2/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ server: data.message || "Registration failed" });
        return;
      }

    setErrors({});
    navigate("/verify-pending", {
      state: { email: formData.email },
      replace: true,
    });

    } catch (err) {
      setErrors({ server: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <h1 className="register-title">Create an account</h1>

      <form className="register-form" onSubmit={handleSubmit}>
        <p className="input-label">Email</p>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          required
        />
        {errors.email && touched.email && (
          <p className="form-error">
            <span className="form-error-icon"><IoWarningOutline /></span>
            {errors.email}
          </p>
        )}

        <p className="input-label">Display Name ( in game Username )</p>
        <input
          type="text"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
          required
        />
        {errors.displayName && touched.displayName && (
          <p className="form-error">
            <span className="form-error-icon"><IoWarningOutline /></span>
            {errors.displayName}
          </p>
        )}

        <p className="input-label">Password</p>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          required
        />
        {errors.password && touched.password && (
          <p className="form-error">
            <span className="form-error-icon"><IoWarningOutline /></span>
            {errors.password}
          </p>
        )}

        <p className="input-label">Confirm Password</p>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
          required
        />
        {errors.confirmPassword && touched.confirmPassword && (
          <p className="form-error">
            <span className="form-error-icon"><IoWarningOutline /></span>
            {errors.confirmPassword}
          </p>
        )}

        
        {errors.server && (
          <p className="form-error">
            <span className="form-error-icon"><IoWarningOutline /></span>
            {errors.server}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`register-submit-btn ${!canSubmit ? "disabled" : ""}`}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

      </form>

      <p className="form-link">
        Already have an account? <Link to="/login" className="form-link-label">Log in</Link>
      </p>
    </div>
  );
};

export default Register;
