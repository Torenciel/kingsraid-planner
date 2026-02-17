import { useLocation } from "react-router-dom";
import { useState } from "react";
import "./VerifyPending.css";

const VerifyPending = () => {
  const location = useLocation();
  const email = location.state?.email;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        "http://localhost:3002/api/v2/auth/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to resend email");
        return;
      }

      setMessage("Verification email sent again.");
      setCooldown(60);

      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-pending-page">
      <h1 className="verify-pending-title">Verify your email</h1>

      <div className="verify-pending-card">
        <p>Your account has been created successfully.</p>
        <p>We sent a verification link to:</p>

        {email && (
          <p className="verify-pending-email">{email}</p>
        )}

        <p>Please check your inbox and click the link.</p>
        
        <p className="verify-pending-muted">
          You might need to check your spam folder.
        </p>

        <button
          onClick={handleResend}
          disabled={loading || cooldown > 0}
          className="verify-resend-btn"
        >
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : loading
            ? "Sending..."
            : "Resend verification email"}
        </button>

        {message && (
          <p className="verify-pending-message">{message}</p>
        )}
      </div>
    </div>
  );
};

export default VerifyPending;
