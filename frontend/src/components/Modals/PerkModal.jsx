// components/Modals/PerkModal.js
import { useEffect, useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import "./PerkModal.css";

const PerkModal = ({ data, onClose }) => {
  const { teamSlotIndex, heroClass, heroName } = data;
  const { updatePerks, perks } = useTeam();

  const [selectedPerks, setSelectedPerks] = useState(
    perks[teamSlotIndex] || []
  );
  const [usedPoints, setUsedPoints] = useState(0);
  const maxPoints = 95;

  // Images T1 pour la première ligne des perks
  const T1_PERK_IMAGES = [
    "ATK Up.png",
    "HP Up.png",
    "DEF up.png",
    "Crit Resist Up.png",
    "Monster Hunting.png",
  ];

  // Images T2 par classe
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

  // Noms des images pour les lignes 3, 4 et 5
  const HERO_PERK_IMAGES = {
    row3: ["s1l.png", "s1d.png", "s2l.png", "s2d.png"],
    row4: ["s3l.png", "s3d.png", "s4l.png", "s4d.png"],
    row5: ["light.png", "dark.png"],
  };

  // Calculate used points
  useEffect(() => {
    const perkLayout = [
      { count: 5, cost: 10 },
      { count: 5, cost: 15 },
      { count: 4, cost: 15 },
      { count: 4, cost: 15 },
      { count: 2, cost: 15 },
    ];

    let totalPoints = 0;
    selectedPerks.forEach((perkIndex) => {
      const rowIndex = Math.floor(perkIndex / 10);
      const cost = perkLayout[rowIndex]?.cost || 0;
      totalPoints += cost;
    });
    setUsedPoints(totalPoints);
  }, [selectedPerks]);

  const togglePerkSelection = (perkIndex, cost) => {
    const newPoints = selectedPerks.includes(perkIndex)
      ? usedPoints - cost
      : usedPoints + cost;

    if (newPoints > maxPoints && !selectedPerks.includes(perkIndex)) {
      alert(
        `Cannot select this perk! You would exceed the ${maxPoints} point limit.`
      );
      return;
    }

    setSelectedPerks((prev) => {
      if (prev.includes(perkIndex)) {
        return prev.filter((p) => p !== perkIndex);
      } else {
        return [...prev, perkIndex];
      }
    });
  };

  const handleConfirm = () => {
    updatePerks(teamSlotIndex, selectedPerks);
    onClose();
  };

  const renderPerkGrid = () => {
    const perkLayout = [
      { count: 5, cost: 10 },
      { count: 5, cost: 15 },
      { count: 4, cost: 15 },
      { count: 4, cost: 15 },
      { count: 2, cost: 15 },
    ];

    return (
      <div className="perk-modal-grid">
        {perkLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="perk-modal-row">
            {Array.from({ length: row.count }, (_, i) => {
              const perkIndex = rowIndex * 10 + i;
              const isSelected = selectedPerks.includes(perkIndex);

              return (
                <div
                  key={perkIndex}
                  className={`perk-modal-option ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => togglePerkSelection(perkIndex, row.cost)}
                >
                  {renderPerkImage(rowIndex, i, isSelected, row.cost)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderPerkImage = (rowIndex, perkIndex, isSelected, cost) => {
    // Row 1: T1 perks
    if (rowIndex === 0 && perkIndex < T1_PERK_IMAGES.length) {
      const perkImage = T1_PERK_IMAGES[perkIndex];
      return (
        <img
          src={`/kingsraid-data/assets/perks/t1/${perkImage}`}
          alt={`Perk ${perkIndex}`}
          style={{ opacity: isSelected ? 1 : 0.4 }}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextElementSibling.style.display = "flex";
          }}
        />
      );
    }

    // Row 2: T2 class perks
    if (rowIndex === 1 && heroClass && T2_PERK_IMAGES_BY_CLASS[heroClass]) {
      const classPerks = T2_PERK_IMAGES_BY_CLASS[heroClass];
      if (perkIndex < classPerks.length) {
        const perkImage = classPerks[perkIndex];
        return (
          <img
            src={`/kingsraid-data/assets/perks/t2/${heroClass.toLowerCase()}/${perkImage}`}
            alt={`Perk ${perkIndex}`}
            style={{ opacity: isSelected ? 1 : 0.4 }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        );
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
        const perkImage = perkRow[perkIndex];
        return (
          <img
            src={`/kingsraid-data/assets/heroes/${heroName}/perks/${perkImage}`}
            alt={`Perk ${perkIndex}`}
            style={{ opacity: isSelected ? 1 : 0.4 }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        );
      }
    }

    // Fallback: show cost
    return (
      <div
        style={{
          color: isSelected ? "#1f2937" : "#9ca3af",
          fontWeight: "bold",
          fontSize: "12px",
        }}
      >
        {cost}
      </div>
    );
  };

  return (
    <div>
      <h3 className="perk-modal-title">Perks - {heroName}</h3>

      {/* Points display */}
      <div
        className={`perk-modal-points ${
          usedPoints > maxPoints ? "over-limit" : ""
        }`}
      >
        <div>
          Points used: <span>{usedPoints}</span> / {maxPoints}
        </div>
      </div>

      {/* Perk grid */}
      {renderPerkGrid()}

      {/* Buttons */}
      <div className="perk-modal-buttons">
        <button onClick={handleConfirm} className="perk-modal-confirm">
          Confirm
        </button>
        <button onClick={onClose} className="perk-modal-cancel">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PerkModal;
