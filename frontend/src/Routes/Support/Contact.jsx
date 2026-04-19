import { Link } from "react-router-dom";
import "../Login.css";
import "./Contact.css";

const Contact = () => {
  return (
    <div className="contact-page">
      <h1 className="login-title">Contact</h1>
      <p className="contact-subtitle">
        Have a question or just want to get in touch? Here's where to find us.
      </p>

      <div className="contact-cards">
        <div className="contact-card">
          <h3>Email</h3>
          <p>For general inquiries:</p>
          <a href="mailto:contact@kingsraid-planner.com">
            contact@kingsraid-planner.com
          </a>
        </div>

        <div className="contact-card">
          <h3>Discord</h3>
          <p>Join the community, ask questions, share teams:</p>
          <a href="https://discord.com" target="_blank" rel="noreferrer">
            Join our Discord
          </a>
        </div>

        {/* <div className="contact-card">
          <h3>Reddit</h3>
          <p>Discuss King's Raid strategies and builds:</p>
          <a href="https://www.reddit.com/r/Kings_Raid/" target="_blank" rel="noreferrer">r/Kings_Raid</a>
        </div> */}

        {/* <div className="contact-card">
          <h3>GitHub</h3>
          <p>Found a bug or want to contribute ?</p>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            View on GitHub
          </a>
        </div> */}
      </div>

      <div className="contact-support-links">
        <p>Looking for something specific?</p>
        <div className="contact-support-btns">
          <Link to="/feedback">Send Feedback</Link>
          <Link to="/bug-report">Report a Bug</Link>
        </div>
      </div>
    </div>
  );
};

export default Contact;
