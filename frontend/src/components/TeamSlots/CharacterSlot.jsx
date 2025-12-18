import "./CharacterSlot.css";

const CharacterSlot = ({ hero, onRemove }) => {
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

  const classIconPath = getClassIconPath(hero.role);

  return (
    <div className="character-slot">
      <img src={hero.image} alt={hero.name} className="character-slot-image" />
      <div className="team-hero-name">{hero.name}</div>
      {classIconPath && (
        <img src={classIconPath} alt={hero.role} className="team-class-icon" />
      )}
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
    </div>
  );
};

export default CharacterSlot;
