// frontend/src/components/HeroGrid/HeroGrid.jsx
import { useHeroContext } from "../../contexts/HeroContext";
import { useTeam } from "../../contexts/TeamContext";
import HeroCard from "./HeroCard";
import "./HeroGrid.css";

const HeroGrid = () => {
  const { team } = useTeam();
  const { 
    currentHeroes, 
    filters, 
    updateFilter, 
    loading, 
    heroCount, 
    availableCount,
    totalHeroes
  } = useHeroContext();

  const isHeroInTeam = (heroId) => {
    return team.some((slot) => slot && (slot.id === heroId || slot.slug === heroId));
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
        {/* Availability Filter */}
        <select
          value={filters.availability}
          onChange={(e) => updateFilter("availability", e.target.value)}
          className="hero-grid-filter-select"
        >
          <option value="all">All Heroes ({totalHeroes})</option>
          <option value="available">Released Heroes ({availableCount})</option>
        </select>

        {/* Hero Count */}
        <div className="hero-grid-footer">
          Showing <span className="highlight">{heroCount}</span> of {totalHeroes} heroes
        </div>

        <div className="hero-grid-filter-group">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="hero-grid-filter-input"
          />

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => updateFilter("role", e.target.value)}
            className="hero-grid-filter-select"
          >
            <option value="all">All Roles</option>
            <option value="Knight">Knight</option>
            <option value="Warrior">Warrior</option>
            <option value="Archer">Archer</option>
            <option value="Mechanic">Mechanic</option>
            <option value="Assassin">Assassin</option>
            <option value="Wizard">Wizard</option>
            <option value="Priest">Priest</option>
          </select>
          
          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="hero-grid-filter-select"
          >
            <option value="name">Sort by Name</option>
            <option value="release">Sort by Release</option>
            <option value="masang">Sort by Availability</option>
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
                updateFilter("role", "all");
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
