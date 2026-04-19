import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>KingsRaid Planner</h3>
          <p>
            A fan-made team builder that helps players build, save, and share
            King's Raid teams.
          </p>
        </div>

        <div className="footer-column">
          <h4>Project</h4>
          <Link to="/about">About</Link>
          <Link to="/roadmap">Roadmap</Link>
          <Link to="/changelog">Changelog</Link>
        </div>

        <div className="footer-column">
          <h4>Support</h4>
          <Link to="/feedback">Feedback</Link>
          <Link to="/bug-report">Report a Bug</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="footer-column">
          <h4>Community</h4>
          <a
            href="https://www.reddit.com/r/Kings_Raid/"
            target="_blank"
            rel="noreferrer"
          >
            Official Reddit
          </a>
          <a href="https://discord.com" target="_blank" rel="noreferrer">
            Discord
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>

        <div className="footer-column">
          <h4>Legal</h4>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
          <Link to="/legal-notice">Legal Notice</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} KingsRaid Planner</p>
        <p className="footer-disclaimer">
          KingsRaid Planner is a fan-made project and is not affiliated with,
          endorsed by, or sponsored by the developers or publishers of King's
          Raid.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
