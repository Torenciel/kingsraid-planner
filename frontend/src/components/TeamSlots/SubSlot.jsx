import "./SubSlot.css";

const SubSlot = ({
  teamSlotIndex,
  subSlotIndex,
  item,
  stars,
  advancement,
  onClick,
  hasHero,
  heroSlug,
  heroName,
  slotRef,
}) => {
  const subSlotNames = ["UW", "UT", "Artifact", "GearSet"];

  if (!hasHero) {
    return (
      <div className="sub-slot empty">
        <span className="sub-slot-plus">+</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div
        className="sub-slot empty"
        onClick={() => onClick(teamSlotIndex, subSlotIndex)}
      >
        <span className="sub-slot-plus">+</span>
      </div>
    );
  }

  /* ===============================
     ADVANCEMENT
  =============================== */

  const getAdvancementString = () => {
    if (advancement === null || advancement === undefined) return "none";
    if (advancement === 0) return "blue";
    if (advancement === 1) return "purple";
    if (advancement === 2) return "red";
    return "none";
  };

  const getBorderClass = () => {
    if (subSlotIndex === 0) {
      const advString = getAdvancementString();
      if (advString !== "none") {
        return `uw-advancement-${advString}`;
      }
    }
    return "";
  };

  const getAdvancementIconPath = () => {
    const advString = getAdvancementString();
    if (advString !== "none") {
      return `/kingsraid-data/assets/advancements/${advString}.png`;
    }
    return "";
  };

  /* ===============================
     IMAGE RESOLUTION
  =============================== */

  const getItemImageUrl = () => {
    if (!item || typeof item !== "object") return "";

    switch (subSlotIndex) {
      case 0: // UW
        return `/kingsraid-data/assets/heroes/${heroName}/uw.png`;

      case 1: // UT
        return `/kingsraid-data/assets/heroes/${heroName}/ut/${item.choice || 1}.png`;

      case 2: // Artifact
        if (item.artifactInfo?.thumbnail) {
          const filename = item.artifactInfo.thumbnail.split("/").pop();
          const encodedFilename = filename.replace(/\s/g, "%20");
          return `/kingsraid-data/assets/artifacts/${encodedFilename}`;
        }
        return "";

      case 3: // GearSet
        if (item.gearSetInfo?.thumbnail) {
          const filename = item.gearSetInfo.thumbnail.split("/").pop();
          const encodedFilename = filename.replace(/\s/g, "%20");
          return `/kingsraid-data/assets/gearsets/${encodedFilename}`;
        }
        if (item.gearSetSlug) {
          return `/kingsraid-data/assets/gearsets/${item.gearSetSlug}.png`;
        }
        return "";

      default:
        return "";
    }
  };

  /* ===============================
     GEAR SET RENDERING
  =============================== */

  const renderGearSet = () => {
    const imageUrl = getItemImageUrl();
    const pieces = item.pieces || 0;

    return (
      <div className="relative w-full h-full">
        <img
          src={imageUrl}
          alt="Gear Set"
          className="sub-slot-image"
        />
        <div className="sub-slot-fallback">Gear</div>
        <div className="sub-slot-stars">{pieces}P</div>
      </div>
    );
  };

  /* ===============================
     NORMAL SLOT RENDERING
  =============================== */

  const renderNormalSlot = () => {
    const imageUrl = getItemImageUrl();
    const slotName = subSlotNames[subSlotIndex];

    return (
      <>
        <img
          src={imageUrl}
          alt={slotName}
          className="sub-slot-image"
        />
        <div className="sub-slot-fallback">{slotName}</div>

        {stars > 0 && (
          <div className="sub-slot-stars">{stars}★</div>
        )}

        {subSlotIndex === 0 &&
          advancement !== null &&
          advancement !== undefined && (
            <div className="advancement-corner-icon">
              <img
                src={getAdvancementIconPath()}
                alt={getAdvancementString()}
              />
            </div>
          )}
      </>
    );
  };

  const renderContent = () => {
    if (subSlotIndex === 3) {
      return renderGearSet();
    }
    return renderNormalSlot();
  };

  return (
    <div ref={slotRef} className="relative">
      <div
        className={`sub-slot ${getBorderClass()}`}
        onClick={() =>
          onClick(teamSlotIndex, subSlotIndex)
        }
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default SubSlot;
