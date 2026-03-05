import "./Legal.css";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="home-hero">
      <div className="home-text">
        <h1 className="main-title">Privacy Policy</h1>
        <h2 className="main-subtitle">
          How KingsRaid Planner handles your data
        </h2>

        <div className="main-text">

          <h2>1. Website Operator</h2>
          <p>
            KingsRaid Planner is an independent fan-made tool designed to help
            players create and share team builds for the game Kings Raid.
          </p>
          <p>
            If you have any questions regarding this policy, you can contact:
            contact@kingsraid-planner.com
          </p>

          <h2>2. Data We Collect</h2>
          <p>
            When you create an account or use the planner, the following
            information may be collected:
          </p>
          <ul>
            <li>Email address</li>
            <li>Display name</li>
            <li>Saved teams and planner configurations</li>
            <li>User preferences and settings</li>
            <li>Technical information such as browser type or IP address</li>
          </ul>

          <h2>3. Why We Collect Data</h2>
          <p>
            Data is collected only for the purpose of providing the features of
            the website, including:
          </p>
          <ul>
            <li>Account authentication and security</li>
            <li>Saving and managing team builds</li>
            <li>Improving the planner and user experience</li>
          </ul>

          <h2>4. Cookies</h2>
          <p>
            KingsRaid Planner uses cookies required for authentication and
            basic website functionality.
          </p>
          <p>
            For detailed information, please see our <Link className="legal-link" to="/cookie-policy">Cookie Policy</Link>.
          </p>

          <h2>5. Data Storage and Security</h2>
          <p>
            User data is stored securely using a MongoDB database and protected
            with standard security practices.
          </p>
          <p>
            Passwords are never stored in plain text and are securely hashed
            before being saved.
          </p>

          <h2>6. Data Sharing</h2>
          <p>
            KingsRaid Planner does not sell, trade, or share your personal data
            with third parties.
          </p>
          <p>
            Data may only be processed by services required to operate the
            website infrastructure, such as hosting providers.
          </p>

          <h2>7. Your Rights</h2>
          <p>
            In accordance with applicable privacy laws, users may request:
          </p>
          <ul>
            <li>Access to the personal data stored about them</li>
            <li>Correction of inaccurate data</li>
            <li>Deletion of their account and related data</li>
          </ul>

          <h2>8. Policy Updates</h2>
          <p>
            This privacy policy may be updated when necessary to reflect
            improvements to the website or changes in regulations.
          </p>

          <h2>9. Contact</h2>
          <p>
            For privacy-related questions or data requests, contact:
            contact@kingsraid-planner.com
          </p>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;