import "./PerkSlot.css";

const PerkSlot = ({ teamSlotIndex, hasPerks, onClick }) => {
  return (
    <div className="perk-slot-container">
      <div
        className={`perk-main-slot ${hasPerks ? "perk-slot-active" : "empty"}`}
        onClick={() => onClick(teamSlotIndex)}
      >
        <span className={`perk-slot-text ${hasPerks ? "active" : "inactive"}`}>
          Perks
        </span>
      </div>
    </div>
  );
};

export default PerkSlot;
