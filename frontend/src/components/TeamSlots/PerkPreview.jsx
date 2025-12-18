import "./PerkPreview.css";

const PerkPreview = ({
  selectedPerks,
  heroClass,
  heroName,
  size = "medium",
}) => {
  // Conditions pour l'affichage :
  // 1. Pas de héros → conteneur vide
  // 2. Avec héros mais PAS de perks sélectionnées (selectedPerks vide) → conteneur vide
  // 3. Avec héros ET avec au moins une perk sélectionnée → afficher TOUTES les images (sélectionnées en couleur, autres grisées)

  if (!heroName || !selectedPerks || selectedPerks.length === 0) {
    return <div className={`perk-preview ${size}`}></div>;
  }

  // Si on arrive ici, c'est qu'il y a un héros ET au moins une perk sélectionnée

  // Mêmes données d'images que dans le modal
  const T1_PERK_IMAGES = [
    "ATK Up.png",
    "HP Up.png",
    "DEF up.png",
    "Crit Resist Up.png",
    "Monster Hunting.png",
  ];

  const T2_PERK_IMAGES_BY_CLASS = {
    Knight: [
      "Experienced Fighter.png",
      "Excellent Strategy.png",
      "Battle Cry.png",
      "Shield of Protection.png",
      "Swift Move.png",
    ],
    Warrior: [
      "Opportune Strike.png",
      "Warlike.png",
      "Offensive Guard.png",
      "Tactical Foresight.png",
      "Blood Wrath.png",
    ],
    Assassin: [
      "Target Weakness.png",
      "Swift and Nimble.png",
      "Tactical Foresight.png",
      "Opportune Strike.png",
      "Vital Detection.png",
    ],
    Mechanic: [
      "Target Weakness.png",
      "Ready Cannons.png",
      "Pressure Point.png",
      "Special Bullet.png",
      "Amplified Gunpowder.png",
    ],
    Archer: [
      "Precision Shot.png",
      "Eagle Eye.png",
      "Mortal Wound.png",
      "Opportune Strike.png",
      "Concentration.png",
    ],
    Wizard: [
      "Deception.png",
      "Moral Rise.png",
      "Blessing of Mana.png",
      "Circuit Burst.png",
      "Destruction.png",
    ],
    Priest: [
      "Vengeful Curse.png",
      "Goddess Blessing.png",
      "Inner Peace.png",
      "Blessing of Mana.png",
      "Swiftness.png",
    ],
  };

  const HERO_PERK_IMAGES = {
    row3: ["s1l.png", "s1d.png", "s2l.png", "s2d.png"],
    row4: ["s3l.png", "s3d.png", "s4l.png", "s4d.png"],
    row5: ["light.png", "dark.png"],
  };

  const perkLayout = [5, 5, 4, 4, 2];

  const getPerkImage = (rowIndex, perkIndex) => {
    // Row 1: T1 perks
    if (rowIndex === 0 && perkIndex < T1_PERK_IMAGES.length) {
      return `/kingsraid-data/assets/perks/t1/${T1_PERK_IMAGES[perkIndex]}`;
    }

    // Row 2: T2 class perks
    if (rowIndex === 1 && heroClass && T2_PERK_IMAGES_BY_CLASS[heroClass]) {
      const classPerks = T2_PERK_IMAGES_BY_CLASS[heroClass];
      if (perkIndex < classPerks.length) {
        return `/kingsraid-data/assets/perks/t2/${heroClass.toLowerCase()}/${
          classPerks[perkIndex]
        }`;
      }
    }

    // Rows 3-5: Hero-specific perks
    if (rowIndex >= 2 && heroName) {
      const perkRow =
        rowIndex === 2
          ? HERO_PERK_IMAGES.row3
          : rowIndex === 3
          ? HERO_PERK_IMAGES.row4
          : HERO_PERK_IMAGES.row5;

      if (perkIndex < perkRow.length) {
        return `/kingsraid-data/assets/heroes/${heroName}/perks/${perkRow[perkIndex]}`;
      }
    }

    return null;
  };

  return (
    <div className={`perk-preview ${size}`}>
      {perkLayout.map((perkCount, rowIndex) => (
        <div key={rowIndex} className="perk-preview-row">
          {Array.from({ length: perkCount }, (_, i) => {
            const perkIndex = rowIndex * 10 + i;
            const isSelected = selectedPerks.includes(perkIndex);
            const imageUrl = getPerkImage(rowIndex, i);

            return (
              <div
                key={perkIndex}
                className={`perk-preview-option ${
                  isSelected ? "selected" : ""
                }`}
              >
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={`Perk ${perkIndex}`}
                      className="perk-preview-image"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="perk-preview-fallback">
                      {rowIndex === 0 ? "T1" : rowIndex === 1 ? "T2" : "H"}
                    </div>
                  </>
                ) : (
                  <div className="perk-preview-fallback">
                    {rowIndex === 0 ? "T1" : rowIndex === 1 ? "T2" : "H"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default PerkPreview;
