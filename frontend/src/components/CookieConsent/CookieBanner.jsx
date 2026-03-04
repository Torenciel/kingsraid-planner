import { useEffect, useState } from "react";
import {
  getCookieConsent,
  saveCookieConsent,
} from "../../utils/cookieConsent";
import "./CookieBanner.css";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    saveCookieConsent({ analytics: true });
    setVisible(false);
  };

  const handleRejectOptional = () => {
    saveCookieConsent({ analytics: false });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-content">
        <p>
          We use essential cookies to ensure the proper functioning of the website.
          Optional analytics cookies help us improve the experience.
          <br/>
          <a className="cookie-banner-link" href="/privacy-policy">Read our Privacy Policy</a>.
        </p>
        <div className="cookie-buttons">
          <button
            className="cookie-btn secondary"
            onClick={handleRejectOptional}
          >
            Decline All
          </button>

          <button
            className="cookie-btn primary"
            onClick={handleAcceptAll}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;