import { useState } from "react";
import { IoWarningOutline, IoCheckmarkCircleOutline } from "react-icons/io5";
import "../Login.css";

const BugReport = () => {
  const [form, setForm] = useState({ name: "", email: "", title: "", description: "", steps: "", device: "", website: "" });
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
      const res = await fetch(`${API_BASE_URL}/api/v2/support/bug-report`, {
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
      setForm({ name: "", email: "", title: "", description: "", steps: "", device: "", website: "" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ maxWidth: "520px" }}>
      <h1 className="login-title">Bug Report</h1>
      <p style={{ textAlign: "center", marginBottom: "1.5rem", color: "var(--color-text-muted)", fontSize: "14px" }}>
        Found something broken? Let us know and we'll fix it.
      </p>

      {success ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", marginTop: "2rem" }}>
          <IoCheckmarkCircleOutline size={48} color="var(--color-validation-default)" />
          <p style={{ fontWeight: 600 }}>Bug report sent. Thank you!</p>
          <button onClick={() => setSuccess(false)} style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", borderRadius: "4px", cursor: "pointer", background: "var(--color-secondary-default)" }}>
            Report another
          </button>
        </div>
      ) : (
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Honeypot — hidden from real users, bots will fill it */}
          <input name="website" value={form.website} onChange={handleChange} style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
          <p className="input-label">Title <span style={{ color: "var(--color-error-default)" }}>*</span></p>
          <input name="title" type="text" value={form.title} onChange={handleChange} required placeholder="Short description of the bug" />

          <p className="input-label">Description <span style={{ color: "var(--color-error-default)" }}>*</span></p>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
            placeholder="What happened? What did you expect to happen?"
            style={{ background: "var(--color-primary-default)", padding: "0.75rem", borderRadius: "4px", marginBottom: "16px", fontSize: "1rem", resize: "vertical", fontFamily: "inherit" }}
          />

          <p className="input-label">Steps to reproduce <span style={{ color: "var(--color-text-muted)" }}>(optional)</span></p>
          <textarea
            name="steps"
            value={form.steps}
            onChange={handleChange}
            rows={3}
            placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
            style={{ background: "var(--color-primary-default)", padding: "0.75rem", borderRadius: "4px", marginBottom: "16px", fontSize: "1rem", resize: "vertical", fontFamily: "inherit" }}
          />

          <p className="input-label">Browser / Device <span style={{ color: "var(--color-text-muted)" }}>(optional)</span></p>
          <input name="device" type="text" value={form.device} onChange={handleChange} placeholder="e.g. Chrome on Windows 11" />

          <p className="input-label">Your name <span style={{ color: "var(--color-text-muted)" }}>(optional)</span></p>
          <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Your name" />

          <p className="input-label">Email <span style={{ color: "var(--color-text-muted)" }}>(optional — if you want a reply)</span></p>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />

          {error && (
            <p className="form-error">
              <span className="form-error-icon"><IoWarningOutline /></span>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Bug Report"}
          </button>
        </form>
      )}
    </div>
  );
};

export default BugReport;
