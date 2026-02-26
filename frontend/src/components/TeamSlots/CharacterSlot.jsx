import "./CharacterSlot.css";

const getHeroSlug = (hero) => {
  if (!hero) return null;

  if (hero.slug) return hero.slug;

  if (hero.id && typeof hero.id === "string") return hero.id;

  if (hero.name) {
    return hero.name.toLowerCase().replace(/\s+/g, "-");
  }

  return null;
};

const getHeroImagePath = (hero) => {
  const slug = getHeroSlug(hero);
  if (!slug) return "";

  const folderName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return `/kingsraid-data/assets/heroes/${folderName}/ico.png`;
};

const CharacterSlot = ({ hero, onRemove, readOnly = false }) => {
  const getClassIconPath = (className) => {
    const classMap = {
      Knight: "/kingsraid-data/assets/classes_hd/knight.png",
      Warrior: "/kingsraid-data/assets/classes_hd/warrior.png",
      Archer: "/kingsraid-data/assets/classes_hd/archer.png",
      Mechanic: "/kingsraid-data/assets/classes_hd/mechanic.png",
      Assassin: "/kingsraid-data/assets/classes_hd/assassin.png",
      Wizard: "/kingsraid-data/assets/classes_hd/wizard.png",
      Priest: "/kingsraid-data/assets/classes_hd/priest.png",
    };
    return classMap[className] || null;
  };

  if (!hero) {
    return (
      <div className="character-slot empty">
        <span className="character-slot-plus">+</span>
      </div>
    );
  }

  const classIconPath = getClassIconPath(hero?.role);

  return (
    <div className="character-slot">
      <img
        src={getHeroImagePath(hero)}
        alt={hero?.name}
        className="character-slot-image"
      />

      <div className="team-hero-name">{hero?.name}</div>

      {classIconPath && (
        <img
          src={classIconPath}
          alt={hero?.role}
          className="team-class-icon"
        />
      )}

      {!readOnly && (
        <div className="team-remove-btn" onClick={onRemove}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M3 3L9 9M9 3L3 9" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default CharacterSlot;
