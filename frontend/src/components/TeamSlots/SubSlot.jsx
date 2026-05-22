import { useSlotPanel } from "../../contexts/SlotPanelContext";
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
  const { activeSlot, openSlotPanel } = useSlotPanel();
  const isActive =
    activeSlot?.teamSlotIndex === teamSlotIndex &&
    activeSlot?.subSlotIndex === subSlotIndex;
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
        className={`sub-slot empty ${isActive ? "active-slot" : ""}`}
        onClick={() => openSlotPanel(teamSlotIndex, subSlotIndex)}
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
     IMAGE RESOLUTION (BUILDER + VIEWER SAFE)
  =============================== */

  const formatSlugToFolder = (slug) => {
    if (!slug) return "";
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

const getItemImageUrl = () => {
  if (!item || typeof item !== "object") return "";

  const formatSlugToFolder = (slug) => {
    if (!slug) return "";
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  switch (subSlotIndex) {

    /* ===============================
       UW
    =============================== */
    case 0: {
      if (!heroSlug) return "";
      const folder = formatSlugToFolder(heroSlug);
      return `/kingsraid-data/assets/heroes/${folder}/uw.png`;
    }

    /* ===============================
       UT
    =============================== */
    case 1: {
      if (!heroSlug) return "";
      const folder = formatSlugToFolder(heroSlug);
      return `/kingsraid-data/assets/heroes/${folder}/ut/${item.choice || 1}.png`;
    }

    /* ===============================
   ARTIFACT
=============================== */
case 2: {

  // Builder metadata version (already correct filename)
  if (item.artifactInfo?.thumbnail) {
    const filename = item.artifactInfo.thumbnail.split("/").pop();
    return `/kingsraid-data/assets/artifacts/${encodeURIComponent(filename)}`;
  }

  // Viewer slug → convert kebab-case to real filename
  if (item.artifactSlug) {
    const filename =
      item.artifactSlug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    // IMPORTANT: manually restore apostrophe for common pattern
    const fixed = filename.replace("Years", "Year's");

    return `/kingsraid-data/assets/artifacts/${encodeURIComponent(fixed)}.png`;
  }

  return "";
}



    /* ===============================
       GEARSET
    =============================== */
case 3: {
  const slug = item.gearSetSlug || item.sets?.[0];
  if (!slug) return "";

  // convert dash to underscore
  const filename = slug.replace(/-/g, "_");

  return `/kingsraid-data/assets/gearsets/${filename}.png`;
}


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
        className={`sub-slot ${getBorderClass()} ${isActive ? "active-slot" : ""}`}
        onClick={() => openSlotPanel(teamSlotIndex, subSlotIndex)}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default SubSlot;
