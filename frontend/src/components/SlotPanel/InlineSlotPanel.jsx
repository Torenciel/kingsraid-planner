import { useSlotPanel } from "../../contexts/SlotPanelContext";
import { useTeam } from "../../contexts/TeamContext";
import { ArtifactPanel, GearSetPanel, PerksPanel, UTPanel, UWPanel } from "./SlotPanels";
import "./InlineSlotPanel.css";

const SLOT_LABELS = ["Unique Weapon", "Unique Treasure", "Artifact", "Gear Set", "Perks"];

const InlineSlotPanel = () => {
  const { activeSlot, closeSlotPanel } = useSlotPanel();
  const { team, subSlots, subStars, advancements } = useTeam();

  const isOpen = !!activeSlot;

  if (!isOpen) {
    return (
      <div className="isp-collapsed">
        <span className="isp-collapsed-icon">›</span>
        <span className="isp-collapsed-hint">Click a slot or perk to edit</span>
        <span className="isp-collapsed-icon">‹</span>
      </div>
    );
  }

  const { teamSlotIndex, subSlotIndex } = activeSlot;
  const hero = team?.[teamSlotIndex];

  if (!hero) return null;

  const heroObj = {
    name: hero.name,
    slug: hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-"),
    role: hero.role,
  };

  const slots = subSlots[teamSlotIndex] || [];
  const stars = subStars[teamSlotIndex] || [];
  const advancement = advancements[teamSlotIndex] ?? null;

  const renderPanel = () => {
    switch (subSlotIndex) {
      case 0:
        return <UWPanel hero={heroObj} teamSlotIndex={teamSlotIndex} subSlotIndex={0} currentItem={slots[0]} currentStars={stars[0]} currentAdvancement={advancement} />;
      case 1:
        return <UTPanel hero={heroObj} teamSlotIndex={teamSlotIndex} subSlotIndex={1} currentItem={slots[1]} currentStars={stars[1]} />;
      case 2:
        return <ArtifactPanel teamSlotIndex={teamSlotIndex} subSlotIndex={2} currentItem={slots[2]} currentStars={stars[2]} />;
      case 3:
        return <GearSetPanel teamSlotIndex={teamSlotIndex} subSlotIndex={3} currentItem={slots[3]} />;
      case 4:
        return <PerksPanel hero={heroObj} teamSlotIndex={teamSlotIndex} />;
      default:
        return null;
    }
  };

  const panelKey = `${teamSlotIndex}-${subSlotIndex}`;

  return (
    <div className="isp-open">
      <div className="isp-header">
        <span className="isp-header-label">
          {SLOT_LABELS[subSlotIndex]} — {hero.name}
        </span>
        <button className="isp-close" onClick={closeSlotPanel}>✕</button>
      </div>
      <div className="isp-body">
        <div key={panelKey}>
          {renderPanel()}
        </div>
      </div>
    </div>
  );
};

export default InlineSlotPanel;
