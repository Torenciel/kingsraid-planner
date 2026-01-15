// components/UI/Navbar.jsx - Version avec 4 colonnes de 2 pour quick links
import { useEffect, useRef, useState } from "react";
import { BiTime } from "react-icons/bi";
import { FaUserGroup } from "react-icons/fa6";
import { Link } from "react-router-dom";
import "./Navbar.css";

const BASE_PATH = process.env.PUBLIC_URL || "";

const Navbar = () => {
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

  // Images des bosses pour les liens rapides (4 colonnes de 2)
  const bossLinks = [
    [
      {
        id: "wb",
        name: "WB",
        image: `${BASE_PATH}/kingsraid-data/assets/bosses/Xanadus.png`,
        to: "/teams/public/wb",
      },
      {
        id: "raid",
        name: "Raid",
        image: `${BASE_PATH}/kingsraid-data/assets/bosses/Black_Dragon.png`,
        to: "/teams/public/raid",
      },
    ],
    [
      {
        id: "gc",
        name: "GC",
        image: `${BASE_PATH}/kingsraid-data/assets/bosses/Velkazar.png`,
        to: "/teams/public/gc",
      },
      {
        id: "gr",
        name: "GR",
        image: `${BASE_PATH}/kingsraid-data/assets/bosses/Manticore.png`,
        to: "/teams/public/gr",
      },
    ],
    [
      {
        id: "trial",
        name: "Trial",
        image: `${BASE_PATH}/kingsraid-data/assets/bosses/Sekmaha.png`,
        to: "/teams/public/trial",
      },
      {
        id: "shakmeh",
        name: "Shakmeh",
        image: `${BASE_PATH}/kingsraid-data/assets/bosses/Otherworldly Darkness Shakmeh.png`,
        to: "/teams/public/shakmeh",
      },
    ],
    [
      {
        id: "story",
        name: "Story",
        image: `${BASE_PATH}/kingsraid-data/assets/bosses/story.png`,
        to: "/teams/public/story",
      },
      {
        id: "pvp",
        name: "PvP",
        image: `${BASE_PATH}/kingsraid-data/assets/bosses/pvp.png`,
        to: "/teams/public/pvp",
      },
    ],
  ];

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
      { to: "/tool-1", label: "Tool 1" },
      { to: "/tool-2", label: "Tool 2" },
      { to: "/tool-3", label: "Tool 3" },
    ],
    community: [
      { to: "/feedback", label: "Feedback" },
      { to: "/discord", label: "Discord" },
      { to: "/github", label: "Github" },
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
          <span className="navbar-brand-text">King's Raid Planner</span>
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
            to="/teams"
            className="navbar-dropdown-toggle"
            onClick={handleItemClick}
          >
            <span className="dropdown-button-content">Teams</span>
          </Link>

          {activeDropdown === "teams" && (
            <div
              className="navbar-dropdown-menu teams-dropdown-menu"
              onMouseEnter={cancelClose}
            >
              <div className="teams-dropdown-content">
                {/* Colonne gauche */}
                <div className="teams-dropdown-left">
                  <div className="section-header">
                    <FaUserGroup className="section-icon" />
                    <h4 className="section-title">Public Teams</h4>
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

                {/* Colonne droite - Liens rapides en 4 colonnes */}
                <div className="teams-dropdown-right">
                  <div className="section-header">
                    <FaUserGroup className="section-icon" />
                    <h4 className="section-title">Public Teams</h4>
                  </div>
                  <div className="boss-links-columns">
                    {/* 4 colonnes de 2 liens */}
                    {bossLinks.map((column, colIndex) => (
                      <div key={colIndex} className="boss-links-column">
                        {column.map((boss) => (
                          <Link
                            key={boss.id}
                            to={boss.to}
                            className="boss-link-item"
                            onClick={handleItemClick}
                          >
                            <div className="boss-link-image-container">
                              <img
                                src={boss.image}
                                alt={boss.name}
                                className="boss-link-image"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextElementSibling.style.display =
                                    "flex";
                                }}
                              />
                              <div className="boss-link-fallback">
                                {boss.name}
                              </div>
                            </div>
                            <div className="boss-link-name">{boss.name}</div>
                          </Link>
                        ))}
                      </div>
                    ))}
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

        {/* ========== DROPDOWN COMMUNITY ========== */}
        <div
          className="navbar-dropdown-container"
          onMouseEnter={() => handleMouseEnter("community")}
          onMouseLeave={handleMouseLeave}
        >
          <button className="navbar-dropdown-toggle">
            <span className="dropdown-button-content">Community</span>
          </button>

          {activeDropdown === "community" && (
            <div className="navbar-dropdown-menu" onMouseEnter={cancelClose}>
              {dropdownItems.community.map((item) => (
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

        {/* Lien simple About */}
        {/* <Link to="/about" className="navbar-link">
          About
        </Link> */}
      </div>
    </nav>
  );
};

export default Navbar;
