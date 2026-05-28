import { useState } from "react";
import { IoWarningOutline, IoCheckmarkCircleOutline } from "react-icons/io5";
import "../Login.css";

const CATEGORIES = ["General", "Suggestion", "Praise", "Other"];

const Feedback = () => {
  const [form, setForm] = useState({ name: "", email: "", category: "General", message: "", website: "" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v2/support/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSuccess(true);
      setForm({ name: "", email: "", category: "General", message: "", website: "" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1 className="login-title">Feedback</h1>
      <p style={{ textAlign: "center", marginBottom: "1.5rem", color: "var(--color-text-muted)", fontSize: "14px" }}>
        Share your thoughts, suggestions or general impressions about the tool.
      </p>

      {success ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", marginTop: "2rem", color: "var(--color-text-default)" }}>
          <IoCheckmarkCircleOutline size={48} color="var(--color-validation-default)" />
          <p style={{ fontWeight: 600 }}>Thank you for your feedback!</p>
          <button className="login-form" style={{ marginTop: "1rem" }} onClick={() => setSuccess(false)}>
            Send another
          </button>
        </div>
      ) : (
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Honeypot — hidden from real users, bots will fill it */}
          <input name="website" value={form.website} onChange={handleChange} style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
          <p className="input-label">Category</p>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={{ background: "var(--color-primary-default)", padding: "0.75rem", borderRadius: "4px", marginBottom: "16px", fontSize: "1rem" }}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <p className="input-label">Name <span style={{ color: "var(--color-text-muted)" }}>(optional)</span></p>
          <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Your name" />

          <p className="input-label">Email <span style={{ color: "var(--color-text-muted)" }}>(optional — if you want a reply)</span></p>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />

          <p className="input-label">Message <span style={{ color: "var(--color-error-default)" }}>*</span></p>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Write your feedback here..."
            style={{ background: "var(--color-primary-default)", padding: "0.75rem", borderRadius: "4px", marginBottom: "16px", fontSize: "1rem", resize: "vertical", fontFamily: "inherit" }}
          />

          {error && (
            <p className="form-error">
              <span className="form-error-icon"><IoWarningOutline /></span>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Feedback"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Feedback;
