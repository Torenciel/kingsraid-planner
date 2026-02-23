// frontend/src/components/HeroGrid/HeroCard.jsx
import { useTeam } from "../../contexts/TeamContext";
import "./HeroCard.css";

const HeroCard = ({ hero, isInTeam }) => {
  const { addHeroToTeam, removeHeroFromTeam } = useTeam();

  // Get the correct hero image path
  const getHeroImageUrl = (hero) => {
    const imagePath = hero?.image || hero?.infos?.thumbnail;
    
    if (!imagePath) {
      const heroName = hero?.name || hero?.infos?.name || 'unknown';
      return `/kingsraid-data/assets/heroes/${heroName}/ico.png`;
    }
    
    // If path starts with "heroes/", treat it as relative
    if (imagePath.startsWith('heroes/')) {
      return `/kingsraid-data/assets/${imagePath}`;
    }
    
    // If already absolute
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    
    const heroName = hero?.name || hero?.infos?.name || 'unknown';
    return `/kingsraid-data/assets/heroes/${heroName}/ico.png`;
  };

  // Get class icon path
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

  // Normalize hero data
  const normalizedHero = {
    id: hero?.slug || hero?.id || hero?._id,
    name: hero?.name || hero?.infos?.name || 'Unknown',
    role: hero?.infos?.class || hero?.class || hero?.role || 'Unknown',
    image: getHeroImageUrl(hero)
  };

  const handleClick = () => {
    if (isInTeam) {
      removeHeroFromTeam(normalizedHero.id);
    } else {
      addHeroToTeam(normalizedHero);
    }
  };

  const classIconPath = getClassIconPath(normalizedHero.role);

  return (
    <div
      className={`hero-card ${isInTeam ? "in-team" : ""}`}
      onClick={handleClick}
    >
      <img 
        src={normalizedHero.image} 
        alt={normalizedHero.name} 
        className="hero-image"
        onError={(e) => {
          e.target.style.display = 'none';
          const placeholder = document.createElement('div');
          placeholder.className = 'hero-image-placeholder';
          placeholder.innerHTML = `
            <div style="background:#333;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;border-radius:8px;">
              <div>No Image</div>
              <div style="font-size:12px;margin-top:5px;">${normalizedHero.name}</div>
            </div>
          `;
          e.target.parentNode.insertBefore(placeholder, e.target.nextSibling);
        }}
      />
      <div className="hero-name">{normalizedHero.name}</div>
      {classIconPath && (
        <img 
          src={classIconPath} 
          alt={normalizedHero.role} 
          className="class-icon"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
    </div>
  );
};

export default HeroCard;
