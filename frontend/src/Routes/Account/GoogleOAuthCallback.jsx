import { useEffect, useRef, useState } from "react";
import { IoCheckmarkCircleOutline, IoWarningOutline } from "react-icons/io5";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../Login.css";

const GoogleOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetchAuth } = useAuth();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [error, setError] = useState(null);
  const hasExecuted = useRef(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";

  useEffect(() => {
    if (hasExecuted.current) return; // Only run once
    hasExecuted.current = true;

    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code) {
        setStatus("error");
        setError("No authorization code received");
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v2/oauth/google/callback`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ code, state }),
          },
        );

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setError(data.error || "Authentication failed");
          return;
        }

        // Refresh auth context with new user
        await refetchAuth();
        setStatus("success");

        // Redirect after a short delay
        setTimeout(() => {
          navigate("/profile");
        }, 1500);
      } catch (err) {
        console.error("OAuth callback error:", err);
        setStatus("error");
        setError("Network error. Please try again.");
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="login-page" style={{ textAlign: "center" }}>
      {status === "loading" && (
        <>
          <h1 className="login-title">Signing in with Google...</h1>
          <div style={{ marginTop: "2rem" }}>
            <div
              style={{
                fontSize: "48px",
                animation: "spin 1s linear infinite",
                display: "inline-block",
              }}
            >
              ⏳
            </div>
          </div>
        </>
      )}

      {status === "success" && (
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <IoCheckmarkCircleOutline
            size={64}
            color="var(--color-validation-default)"
          />
          <h1 className="login-title" style={{ marginTop: "1rem" }}>
            Welcome back!
          </h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            Redirecting to your profile...
          </p>
        </div>
      )}

      {status === "error" && (
        <>
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <IoWarningOutline size={64} color="var(--color-error-default)" />
          </div>
          <h1
            className="login-title"
            style={{ marginTop: "1rem", color: "var(--color-error-default)" }}
          >
            Sign in failed
          </h1>
          <p
            style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}
          >
            {error}
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "var(--color-secondary-default)",
              color: "white",
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Back to Login
          </button>
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GoogleOAuthCallback;
