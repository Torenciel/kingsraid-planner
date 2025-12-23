// frontend/src/components/HeroGrid/HeroCard.jsx
import { useTeam } from "../../contexts/TeamContext";
import "./HeroCard.css";

const HeroCard = ({ hero, isInTeam }) => {
  const { addHeroToTeam, removeHeroFromTeam } = useTeam();

  // Fonction pour obtenir le chemin correct de l'image
  const getHeroImageUrl = (hero) => {
    // Chercher l'image dans différentes sources
    const imagePath = hero?.image || hero?.infos?.thumbnail;
    
    if (!imagePath) {
      // Si pas d'image, construire le chemin depuis le nom
      const heroName = hero?.name || hero?.infos?.name || 'unknown';
      return `/kingsraid-data/assets/heroes/${heroName}/ico.png`;
    }
    
    // Si le chemin commence par "heroes/", c'est un chemin relatif
    // Ex: "heroes/Yanne/ico.png" -> "/kingsraid-data/assets/heroes/Yanne/ico.png"
    if (imagePath.startsWith('heroes/')) {
      return `/kingsraid-data/assets/${imagePath}`;
    }
    
    // Si c'est déjà un chemin absolu (commence par /)
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    
    // Fallback: construire le chemin standard
    const heroName = hero?.name || hero?.infos?.name || 'unknown';
    return `/kingsraid-data/assets/heroes/${heroName}/ico.png`;
  };

  // Fonction pour obtenir le chemin des icônes de classe
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
    
    const iconPath = classMap[className];
    if (iconPath) {
      // Les icônes de classe sont aussi dans le dossier public
      return iconPath;
    }
    
    return null;
  };

  // Normaliser les données du héros
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
          console.error("Image failed to load:", normalizedHero.image);
          // Remplacer par un placeholder si l'image ne charge pas
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
            console.error("Class icon failed to load:", classIconPath);
            e.target.style.display = 'none';
          }}
        />
      )}
    </div>
  );
};

export default HeroCard;