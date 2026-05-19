import "./PerkSlot.css";

const PerkSlot = ({ teamSlotIndex, hasPerks, onClick }) => {
  return (
    <div className="perk-slot-container">
      <div className="perk-main-slot" onClick={() => onClick(teamSlotIndex)}>
        <span className="perk-slot-text">Perks</span>
      </div>
    </div>
  );
};

export default PerkSlot;
