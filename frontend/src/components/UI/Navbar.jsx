// components/UI/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { BiTime } from "react-icons/bi";
import { FaUserGroup } from "react-icons/fa6";

import "./Navbar.css";

const BASE_PATH = process.env.PUBLIC_URL || "";


const Navbar = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const timeoutRef = useRef(null);

  // Gestionnaires d'événements
  const handleMouseEnter = (dropdownName) => {
    clearTimeout(timeoutRef.current);
    setActiveDropdown(dropdownName);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  const cancelClose = () => {
    clearTimeout(timeoutRef.current);
  };

  const handleItemClick = () => {
    setActiveDropdown(null);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // Teams récemment éditées (3 slots fixes)
  const recentTeams = [
    {
      id: 1,
      name: "WB Team 1",
      image: "/kingsraid-data/assets/heroes/Aisha/ico.png",
    },
    {
      id: 2,
      name: "GC Team",
      image: "/kingsraid-data/assets/heroes/Artemia/ico.png",
    },
    {
      id: 3,
      name: "Dragon Farm",
      image: "/kingsraid-data/assets/heroes/Clause/ico.png",
    },
  ];

  // Données pour les autres dropdowns
  const dropdownItems = {
    tools: [
      { to: "/tier-list", label: "Tier list" },
      { to: "/tool-2", label: "Tool 2" },
      { to: "/tool-3", label: "Tool 3" },
    ],
    more: [
      { to: "/feedback", label: "Feedback" },
      { to: "/discord", label: "Discord" },
      { to: "/github", label: "Github" },
      { to: "/about", label: "About" },
    ],
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-brand-link">
        <span className="navbar-brand">
          {/* <img
            src="/Oddy_logo.png"
            alt="King's Raid Planner Logo"
            className="navbar-logo"
            width="60"
            height="60"
          /> */}
          <span className="navbar-brand-text">KRP</span>
        </span>
      </Link>

      {/* Navigation links */}
      <div className="navbar-links">
        {/* ========== DROPDOWN TEAMS AVANCÉ ========== */}
        <div
          className="navbar-dropdown-container"
          onMouseEnter={() => handleMouseEnter("teams")}
          onMouseLeave={handleMouseLeave}
        >
          {/* Changed from button to Link */}
          <Link
            to="/teams/public"
            className="navbar-dropdown-toggle-link"
            onClick={handleItemClick}
          >
          <button className="navbar-dropdown-toggle">
            <span className="dropdown-button-content">Teams</span>
          </button>
          </Link>

          {activeDropdown === "teams" && (
            <div
              className="navbar-dropdown-menu teams-dropdown-menu"
              onMouseEnter={cancelClose}
            >
              <div className="teams-dropdown-content">
                <div className="teams-dropdown-left">
                  <div className="section-header">
                    <FaUserGroup className="section-icon" />
                    <h4 className="section-title">Teams</h4>
                  </div>
                  {/* Boutons principaux */}
                  <div className="teams-main-buttons">
                    <Link
                      to="/teams/private"
                      className="team-main-button"
                      onClick={handleItemClick}
                    >
                      <div className="team-button-text">
                        <div className="team-button-title">My Teams</div>
                      </div>
                    </Link>

                    <Link
                      to="/team/edit"
                      className="team-main-button"
                      onClick={handleItemClick}
                    >
                      <div className="team-button-text">
                        <div className="team-button-title">Create a Team</div>
                      </div>
                    </Link>
                  </div>

                  {/* Teams récemment éditées */}
                  <div className="recent-teams-section">
                    <div className="section-header">
                      <BiTime size={18} className="section-icon" />
                      <h4 className="section-title">Recently edited</h4>
                    </div>
                    <div className="recent-teams-list">
                      {recentTeams.map((team) => (
                        <div key={team.id} className="recent-team-item">
                          <img
                            src={team.image}
                            alt={team.name}
                            className="recent-team-image"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling.style.display =
                                "flex";
                            }}
                          />
                          <div className="recent-team-fallback">
                            {team.name.charAt(0)}
                          </div>
                          <div className="recent-team-name">{team.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========== DROPDOWN TOOLS ========== */}
        <div
          className="navbar-dropdown-container"
          onMouseEnter={() => handleMouseEnter("tools")}
          onMouseLeave={handleMouseLeave}
        >
          <button className="navbar-dropdown-toggle">
            <span className="dropdown-button-content">Tools</span>
          </button>

          {activeDropdown === "tools" && (
            <div className="navbar-dropdown-menu" onMouseEnter={cancelClose}>
              {dropdownItems.tools.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="navbar-dropdown-item"
                  onClick={handleItemClick}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ========== DROPDOWN MORE ========== */}
        <div
          className="navbar-dropdown-container"
          onMouseEnter={() => handleMouseEnter("more")}
          onMouseLeave={handleMouseLeave}
        >
          <button className="navbar-dropdown-toggle">
            <span className="dropdown-button-content">More</span>
          </button>

          {activeDropdown === "more" && (
            <div className="navbar-dropdown-menu" onMouseEnter={cancelClose}>
              {dropdownItems.more.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="navbar-dropdown-item"
                  onClick={handleItemClick}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* ========== AUTH SECTION ========== */}
{!loading && (
  <div
    className="navbar-dropdown-container"
    onMouseEnter={() => handleMouseEnter("profile")}
    onMouseLeave={handleMouseLeave}
  >
    {!isAuthenticated ? (
      <div className="navbar-link">
        <Link to="/login" className="navbar-link login-link">
          Log in
        </Link>
      </div>
    ) : (
      <>
      <Link
        to="/profile"
        className="navbar-dropdown-item"
        onClick={handleItemClick}
        >
        <label className="navbar-profile-label">{user.displayName}</label>
      <img
        src={
          user.profilePicture === "default-avatar.png"
            ? "/default-avatar.png"
            : `http://localhost:3002/${user.profilePicture}?v=${user.avatarVersion}`
        }
        alt="Profile"
        className="navbar-profile-avatar"
      />
        </Link>
        {activeDropdown === "profile" && (
          <div
            className="navbar-dropdown-menu"
            onMouseEnter={cancelClose}
          >
            <Link
              to="/profile"
              className="navbar-dropdown-item"
              onClick={handleItemClick}
            >
              Profile
            </Link>

            <button
              className="navbar-dropdown-item"
              onClick={() => {
                handleItemClick();
                logout();
              }}
            >
              Logout
            </button>
          </div>
        )}
      </>
    )}
  </div>
)}

    </nav>
  );
};

export default Navbar;
