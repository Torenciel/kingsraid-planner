import { useSearchParams, Link } from "react-router-dom";
import "./VerifyEmail.css";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  return (
    <div className="verify-page">
      <div className="verify-card">

        {status === "success" && (
          <div className="verify-message success">
            <h1 className="verify-title">Email verified</h1>
            <p>
              Your email has been successfully verified. You can now log in.
            </p>
            <Link to="/login" className="verify-button">
              Go to login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="verify-message error">
            <h1 className="verify-title">Verification failed</h1>
            <p>
              The verification link is invalid or expired.
            </p>
            <Link to="/register" className="verify-button">
              Create a new account
            </Link>
          </div>
        )}

        {!status && (
          <div className="verify-message error">
            <h1 className="verify-title">Invalid access</h1>
            <p>No verification status provided.</p>
            <Link to="/" className="verify-button">
              Go home
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
