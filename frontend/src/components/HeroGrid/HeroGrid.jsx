import { useHeroContext } from "../../contexts/HeroContext";
import { useTeam } from "../../contexts/TeamContext";
import HeroCard from "./HeroCard";
import "./HeroGrid.css"; // <-- IMPORT

const HeroGrid = () => {
  const { team } = useTeam();
  const { currentHeroes, filters, updateFilter, loading, heroCount } =
    useHeroContext();

  const isHeroInTeam = (heroId) => {
    return team.some((slot) => slot && slot.id === heroId);
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
      {/* 🎛️ BARRE DE FILTRES COMPLÈTE */}
      <div className="hero-grid-filters">
        {/* Filtre Disponibilité */}
        <select
          value={filters.availability}
          onChange={(e) => updateFilter("availability", e.target.value)}
          className="hero-grid-filter-select"
        >
          <option value="all">All Heroes</option>
          <option value="available">Available Heroes</option>
        </select>

        <div className="hero-grid-filter-group">
          {/* Tri */}
          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="hero-grid-filter-select"
          >
            <option value="name">Sort by Name</option>
            <option value="release">Sort by Release</option>
            <option value="masang">Sort by Release (masang)</option>
          </select>

          {/* Filtre Rôle */}
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

          {/* Barre de recherche */}
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="hero-grid-filter-input"
          />
        </div>
      </div>

      {/* 🎨 GRILLE DES HÉROS */}
      <div className="hero-grid">
        {currentHeroes.length === 0 ? (
          <div className="hero-grid-empty">
            No heroes found matching your filters
          </div>
        ) : (
          currentHeroes.map((hero) => (
            <HeroCard
              key={hero.id}
              hero={hero}
              isInTeam={isHeroInTeam(hero.id)}
            />
          ))
        )}
      </div>

      {/* 📊 COMPTEUR */}
      <div className="hero-grid-counter">
        <span className="hero-grid-counter-highlight">{heroCount}</span> heroes
        {filters.availability === "available" && " (available)"}
        {filters.role !== "all" && ` - ${filters.role}`}
        {filters.search && ` - search: "${filters.search}"`}
      </div>
    </div>
  );
};

export default HeroGrid;
