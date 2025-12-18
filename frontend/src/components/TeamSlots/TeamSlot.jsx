import CharacterSlot from "./CharacterSlot";
import PerkPreview from "./PerkPreview";
import PerkSlot from "./PerkSlot";
import SubSlot from "./SubSlot";
import "./TeamSlot.css";

const TeamSlot = ({
  hero,
  teamSlotIndex,
  subSlots,
  subStars,
  advancement,
  perks,
  artifactsData,
  heroesData,
  gearSetsData,
  onRemoveHero,
  onSubSlotClick,
  onPerkClick,
}) => {
  return (
    <div className="team-slot">
      {/* Slot principal du héros */}
      <CharacterSlot
        hero={hero}
        onRemove={() => hero && onRemoveHero(hero.id)}
      />

      {/* Sous-slots (UW, UT, Artifact, GearSet) */}
      <div className="sub-slots-grid">
        {[0, 1, 2, 3].map((subIndex) => (
          <SubSlot
            key={subIndex}
            teamSlotIndex={teamSlotIndex}
            subSlotIndex={subIndex}
            item={subSlots?.[subIndex]}
            stars={subStars?.[subIndex]}
            advancement={subIndex === 0 ? advancement : "none"}
            hasHero={!!hero}
            onClick={onSubSlotClick}
            artifactsData={artifactsData}
            heroesData={heroesData}
            heroName={hero?.name || ""}
            gearSetsData={gearSetsData}
          />
        ))}
      </div>

      {/* Bouton Perks */}
      <PerkSlot
        teamSlotIndex={teamSlotIndex}
        hasPerks={perks && perks.length > 0}
        onClick={onPerkClick}
      />

      {/* Perk Preview */}
      <PerkPreview
        selectedPerks={perks || []}
        heroClass={hero?.role}
        heroName={hero?.name}
      />
    </div>
  );
};

export default TeamSlot;
