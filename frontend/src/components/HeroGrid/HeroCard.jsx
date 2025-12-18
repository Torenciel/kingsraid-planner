import { useTeam } from "../../contexts/TeamContext";
import "./HeroCard.css"; // <-- IMPORT

const HeroCard = ({ hero, isInTeam }) => {
  const { addHeroToTeam, removeHeroFromTeam } = useTeam();

  const handleClick = () => {
    if (isInTeam) {
      removeHeroFromTeam(hero.id);
    } else {
      addHeroToTeam(hero);
    }
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

  const classIconPath = getClassIconPath(hero.role);

  return (
    <div
      className={`hero-card ${isInTeam ? "in-team" : ""}`}
      onClick={handleClick}
    >
      <img src={hero.image} alt={hero.name} className="hero-image" />
      <div className="hero-name">{hero.name}</div>
      {classIconPath && (
        <img src={classIconPath} alt={hero.role} className="class-icon" />
      )}
    </div>
  );
};

export default HeroCard;
