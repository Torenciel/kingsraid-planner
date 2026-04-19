import { useState } from "react";
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
  const [confirming, setConfirming] = useState(false);

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    setConfirming(false);
    onRemove?.();
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setConfirming(false);
  };

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
        <img src={classIconPath} alt={hero?.role} className="team-class-icon" />
      )}

      {!readOnly && confirming && (
        <div className="team-remove-confirm">
          <span>Remove ?</span>
          <button className="team-remove-confirm-yes" onClick={handleConfirm}>
            Yes
          </button>
          <button className="team-remove-confirm-no" onClick={handleCancel}>
            No
          </button>
        </div>
      )}

      {!readOnly && !confirming && (
        <div className="team-remove-btn" onClick={handleRemoveClick}>
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
