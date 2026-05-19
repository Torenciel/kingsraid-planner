// frontend/src/components/HeroGrid/HeroGrid.jsx
import { FaSearch } from "react-icons/fa";
import { useHeroContext } from "../../contexts/HeroContext";
import { useTeam } from "../../contexts/TeamContext";
import HeroCard from "./HeroCard";
import "./HeroGrid.css";

const ROLES = [
  { name: "Knight", file: "knight" },
  { name: "Warrior", file: "warrior" },
  { name: "Archer", file: "archer" },
  { name: "Mechanic", file: "mechanic" },
  { name: "Assassin", file: "assassin" },
  { name: "Wizard", file: "wizard" },
  { name: "Priest", file: "priest" },
];

const HeroGrid = () => {
  const { team } = useTeam();
  const {
    currentHeroes,
    filters,
    updateFilter,
    loading,
    heroCount,
    availableCount,
    totalHeroes,
  } = useHeroContext();

  const isHeroInTeam = (heroId) => {
    return team.some(
      (slot) => slot && (slot.id === heroId || slot.slug === heroId),
    );
  };

  const toggleRole = (roleName) => {
    const current = filters.roles;
    const next = current.includes(roleName)
      ? current.filter((r) => r !== roleName)
      : [...current, roleName];
    updateFilter("roles", next);
  };

  if (loading) {
    return (
      <div className="hero-grid-loading">
        <div className="hero-grid-loading-text">Loading Heroes...</div>
      </div>
    );
  }

  return (
    <div className="hero-grid-container">
      {/* Filter Bar */}
      <div className="hero-grid-filters">
        {/* Left: availability + hero count */}
        <div className="hero-grid-filters-left">
          <select
            value={filters.availability}
            onChange={(e) => updateFilter("availability", e.target.value)}
            className="hero-grid-filter-select"
          >
            <option value="all">All Heroes ({totalHeroes})</option>
            <option value="available">
              Released Heroes ({availableCount})
            </option>
          </select>
          <div className="hero-grid-counter">
            Showing <span className="highlight">{heroCount}</span> of{" "}
            {totalHeroes} heroes
          </div>
        </div>

        {/* Center: search */}
        <div className="hero-grid-search-container">
          <FaSearch className="hero-grid-search-icon" />
          <input
            type="text"
            placeholder="Search by name"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="hero-grid-filter-input"
          />
          {filters.search && (
            <button
              className="hero-grid-search-clear"
              onClick={() => updateFilter("search", "")}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Right: role buttons + sort */}
        <div className="hero-grid-filters-right">
          <div className="hero-grid-role-buttons">
            {ROLES.map((role) => {
              const active = filters.roles.includes(role.name);
              return (
                <button
                  key={role.name}
                  className={`role-filter-btn${active ? " active" : ""}`}
                  onClick={() => toggleRole(role.name)}
                  title={role.name}
                >
                  <img
                    src={`/kingsraid-data/assets/classes_hd/${role.file}.png`}
                    alt={role.name}
                    className="role-filter-img"
                  />
                </button>
              );
            })}
          </div>
          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="hero-grid-filter-select"
          >
            <option value="name">Sort by Name</option>
            <option value="release">Sort by Release</option>
            {/* <option value="masang">Sort by Availability</option> */}
          </select>
        </div>
      </div>

      {/* Hero Grid */}
      <div className="hero-grid">
        {currentHeroes.length === 0 ? (
          <div className="hero-grid-empty">
            <div className="empty-text">
              No heroes found matching your filters
            </div>
            <button
              className="reset-filters-btn"
              onClick={() => {
                updateFilter("availability", "all");
                updateFilter("search", "");
                updateFilter("roles", []);
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          currentHeroes.map((hero) => (
            <HeroCard
              key={hero.id}
              hero={hero}
              isInTeam={isHeroInTeam(hero.slug || hero.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default HeroGrid;
