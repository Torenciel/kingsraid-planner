import { useEffect, useMemo, useRef, useState } from "react";
import { BiTime } from "react-icons/bi";
import { FaUserGroup } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { useArtifacts } from "../../contexts/ArtifactContext";
import { useAuth } from "../../contexts/AuthContext";
import { useHeroes, useTeams } from "../../hooks/useApi";
import { resolveAvatarUrl } from "../../utils/avatarResolver";
import { sortTeamByPosition } from "../../utils/sortTeamByPosition";
import SmartAvatarImage from "../UI/SmartAvatarImage";

import "./Navbar.css";

const getHeroImagePath = (slug) => {
  if (!slug) return "";
  const folderName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return `/kingsraid-data/assets/heroes/${folderName}/ico.png`;
};

const Navbar = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { allArtifacts } = useArtifacts();
  const navigate = useNavigate();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = (dropdownName) => {
    clearTimeout(timeoutRef.current);
    setActiveDropdown(dropdownName);
    if (dropdownName === "teams") refetchRecentTeams?.();
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

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const recentFilters = useMemo(() => {
    if (!isAuthenticated || !user?.id) return null;
    return { author: user.id, sortBy: "updatedAt", limit: 3 }; // change this number to show more/fewer recent teams
  }, [isAuthenticated, user?.id]);

  const { data: recentTeamsData, refetch: refetchRecentTeams } =
    useTeams(recentFilters);
  const recentTeams = recentTeamsData ?? [];

  const { data: heroesMetadata } = useHeroes();
  const heroMetadataMap = useMemo(() => {
    if (!heroesMetadata) return {};
    const map = {};
    heroesMetadata.forEach((hero) => {
      map[hero.slug] = { ...hero, infos: { position: hero.position } };
    });
    return map;
  }, [heroesMetadata]);

  const dropdownItems = {
    tools: [
      { to: "/tier-list", label: "Tier list" },
      // { to: "/tool-2", label: "Tool 2" },
      // { to: "/tool-3", label: "Tool 3" },
    ],
    more: [
      { to: "/feedback", label: "Feedback" },
      { to: "/bug-report", label: "Bug Report" },
      { to: "/discord", label: "Discord" },
      { to: "/about", label: "About us" },
    ],
  };

  const avatarUrl =
    user && isAuthenticated
      ? resolveAvatarUrl(user.avatar, allArtifacts)
      : "/default-avatar.png";

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand-link">
        <span className="navbar-brand">
          <span className="navbar-brand-text">KRP</span>
        </span>
      </Link>

      <div className="navbar-links">
        {/* TEAMS */}
        <div
          className="navbar-dropdown-container"
          onMouseEnter={() => handleMouseEnter("teams")}
          onMouseLeave={handleMouseLeave}
        >
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

                  <div className="teams-main-buttons">
                    <Link
                      to="/teams/private"
                      className="team-main-button"
                      onClick={handleItemClick}
                    >
                      <div className="team-button-title">My Teams</div>
                    </Link>

                    <Link
                      to="/teams/public"
                      className="team-main-button"
                      onClick={handleItemClick}
                    >
                      <div className="team-button-title">Public Teams</div>
                    </Link>

                    <Link
                      to="/team/edit"
                      className="team-main-button"
                      onClick={handleItemClick}
                    >
                      <div className="team-button-title">Create a Team</div>
                    </Link>
                  </div>

                  <div className="recent-teams-section">
                    <div className="section-header">
                      <BiTime size={18} className="section-icon" />
                      <h4 className="section-title">Recently edited</h4>
                    </div>

                    <div className="recent-teams-list">
                      {recentTeams.length === 0 ? (
                        <div className="recent-team-empty">No teams yet</div>
                      ) : (
                        recentTeams.map((team) => (
                          <div
                            key={team.id}
                            className="recent-team-item"
                            onClick={() => {
                              handleItemClick();
                              navigate(`/team/edit/${team.slug}`);
                            }}
                          >
                            <div className="recent-team-heroes">
                              {sortTeamByPosition(team.heroes || [], heroMetadataMap).map((hero) => (
                                <img
                                  key={hero.heroSlug}
                                  src={getHeroImagePath(hero.heroSlug)}
                                  alt={hero.heroSlug}
                                  className="recent-team-image"
                                />
                              ))}
                            </div>
                            <div className="recent-team-name">{team.name}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TOOLS */}
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

        {/* MORE */}
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

      {/* AUTH */}
      {!loading && (
        <div
          className="navbar-dropdown-container"
          onMouseEnter={() => handleMouseEnter("profile")}
          onMouseLeave={handleMouseLeave}
        >
          {!isAuthenticated ? (
            <Link to="/login" className="navbar-link login-link">
              Log in
            </Link>
          ) : (
            <>
              <Link
                to="/profile"
                className="navbar-dropdown-item"
                onClick={handleItemClick}
              >
                <label className="navbar-profile-label">
                  {user.displayName}
                </label>
                <SmartAvatarImage
                  avatar={user.avatar}
                  src={avatarUrl}
                  className="navbar-profile-avatar"
                />
              </Link>

              {activeDropdown === "profile" && (
                <div
                  className="navbar-dropdown-menu auth-dropdown"
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
