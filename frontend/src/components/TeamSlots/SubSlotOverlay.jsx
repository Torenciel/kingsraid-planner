import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import "./SubSlotOverlay.css";
import { useHeroContext } from "../../contexts/HeroContext";
import { useArtifacts } from "../../contexts/ArtifactContext";

const SubSlotOverlay = ({
  subSlotIndex,
  item,
  stars,
  advancement,
  heroSlug,
  slotRef,
  onMouseEnter,
  onMouseLeave,
}) => {
  const overlayRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0, transform: "" });
  const [isCalculated, setIsCalculated] = useState(false);
  const [heroDetails, setHeroDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const { loadHeroDetails } = useHeroContext();
  const { allArtifacts } = useArtifacts();

  /* =========================
     UTILS
  ========================= */

  const getAdvancementString = useCallback((advValue) => {
    if (advValue === null || advValue === undefined) return "none";
    if (advValue === 0) return "blue";
    if (advValue === 1) return "purple";
    if (advValue === 2) return "red";
    return "none";
  }, []);

  const getAdvancementIconPath = useCallback(
    (advValue) => {
      const advString = getAdvancementString(advValue);
      return advString !== "none"
        ? `/kingsraid-data/assets/advancements/${advString}.png`
        : "";
    },
    [getAdvancementString]
  );

  const getBorderClassForOverlay = useCallback(() => {
    if (subSlotIndex !== 0) return "";
    const advString = getAdvancementString(advancement);
    return advString !== "none" ? `border-${advString}` : "";
  }, [subSlotIndex, advancement, getAdvancementString]);

  /* =========================
     HERO DETAILS (UW / UT)
     👉 cache: chargé UNE fois
  ========================= */

  useEffect(() => {
    if (!heroSlug) return;
    if (heroDetails) return; // 🔒 cache important

    const loadHeroData = async () => {
      try {
        setLoading(true);
        const details = await loadHeroDetails(heroSlug);
        setHeroDetails(details);
      } catch (error) {
        console.error("Error loading hero details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHeroData();
  }, [heroSlug, heroDetails, loadHeroDetails]);

  /* =========================
     GEAR SET INFO (INCHANGÉ)
  ========================= */

  const getGearSetInfo = useCallback((item) => {
    if (!item) return null;

    const stats = [];
    let title = "";
    let isMultiSet = false;

    if (item.isMultiSet && item.sets && Array.isArray(item.sets)) {
      isMultiSet = true;

      if (item.set1Info && item.set2Info) {
        stats.push({
          type: "gear_set",
          name: item.set1Info.name,
          description: item.set1Info.bonus2P,
          pieces: "2P",
          isFirst: true,
          isMultiSet: true,
        });

        stats.push({
          type: "gear_set",
          name: item.set2Info.name,
          description: item.set2Info.bonus2P,
          pieces: "2P",
          isFirst: false,
          isMultiSet: true,
        });
      }
    } else {
      const gearSetName =
        item.gearSetInfo?.name ||
        item.gearSetSlug?.replace(/-/g, " ") ||
        "Unknown Gear Set";

      title = gearSetName;

      stats.push({
        type: "gear_set",
        name: gearSetName,
        pieces: "4P",
        description2P: item.gearSetInfo?.bonus2P,
        description4P: item.gearSetInfo?.bonus4P,
        isMultiSet: false,
      });
    }

    return {
      stats,
      title,
      isMultiSet,
    };
  }, []);

  /* =========================
     FORMAT UW / UT / ARTIFACT
     (INCHANGÉ)
  ========================= */

const formatUWUTDescription = useCallback(
  (description, value = {}, starLevel = 0) => {
    if (!description || typeof description !== "string") {
      return [{ type: "text", content: "No description available" }];
    }

    const parts = [];
    let remainingText = description;

    // Remplacer les placeholders dans l'ordre d'apparition
    while (true) {
      const match = remainingText.match(/\((\d+)\)/);
      if (!match) break;

      const key = match[1];           // "0", "1", etc.
      const full = match[0];          // "(0)"
      const before = remainingText.slice(0, match.index);
      const after = remainingText.slice(match.index + full.length);

      if (before) {
        parts.push({ type: "text", content: before });
      }

      let resolvedValue = "???";
      const raw = value?.[key];

      // 🔹 CAS 1 : Artifact (string CSV)
      if (typeof raw === "string") {
        const arr = raw.split(",").map(v => v.trim());
        resolvedValue = arr[starLevel] ?? arr[0] ?? "???";
      }

      // 🔹 CAS 2 : UW / UT (objet indexé)
      else if (raw && typeof raw === "object") {
        resolvedValue =
          raw[String(starLevel)] ??
          raw[starLevel] ??
          raw["0"] ??
          "???";
      }

      parts.push({
        type: "value",
        content: resolvedValue,
      });

      remainingText = after;
    }

    if (remainingText) {
      parts.push({ type: "text", content: remainingText });
    }

    return parts;
  },
  []
);

  /* =========================
     OVERLAY INFO BUILDER
     (corrigé, NON destructif)
  ========================= */

const getOverlayInfo = useCallback(() => {

  /* ---------- UW ---------- */
  if (subSlotIndex === 0) {
    if (!heroDetails) {
      return {
        title: "Unique Weapon",
        stats: [{ type: "text", content: "Loading UW data..." }],
        isUW: true,
      };
    }

    const uw = heroDetails.uw;

    if (!uw) {
      return {
        title: "Unique Weapon",
        stats: [{ type: "text", content: "No Unique Weapon data available" }],
        isUW: true,
      };
    }

    return {
      title: uw.name,
      stats: [
        `${stars}★`,
        {
          type: "formatted",
          content: formatUWUTDescription(
            uw.description,
            uw.value || {},
            stars
          ),
        },
      ],
      isUW: true,
      advancement,
      advancementString: getAdvancementString(advancement),
    };
  }

  /* ---------- UT ---------- */
  if (subSlotIndex === 1) {
    if (!heroDetails) {
      return {
        title: "Unique Treasure",
        stats: [{ type: "text", content: "Loading UT data..." }],
        isUT: true,
      };
    }

    const utNumber = item?.choice ?? 1;

    // 🔥 CORRECTION ICI
    const ut =
      heroDetails.uts?.[utNumber] ||
      heroDetails.uts?.[String(utNumber)] ||
      heroDetails.uts?.[utNumber - 1];

    if (!ut) {
      return {
        title: `Unique Treasure ${utNumber}`,
        stats: [{ type: "text", content: "No UT data available" }],
        isUT: true,
      };
    }

    return {
      title: ut.name,
      stats: [
        `${stars}★`,
        {
          type: "formatted",
          content: formatUWUTDescription(
            ut.description,
            ut.value || {},
            stars
          ),
        },
      ],
      isUT: true,
    };
  }

  /* ---------- ARTIFACT ---------- */
  if (subSlotIndex === 2) {
    if (!item?.artifactSlug) {
      return {
        title: "Artifact",
        stats: [{ type: "text", content: "No artifact selected" }],
        isArtifact: true,
      };
    }

    const artifact =
      allArtifacts?.find((a) => a.slug === item.artifactSlug) ||
      item.artifactInfo;

    if (!artifact) {
      return {
        title: "Artifact",
        stats: [{ type: "text", content: "Artifact data not found" }],
        isArtifact: true,
      };
    }

    return {
      title: artifact.name,
      stats: [
        `${stars}★`,
        {
          type: "formatted",
          content: formatUWUTDescription(
            artifact.description,
            artifact.values || {},
            stars
          ),
        },
      ],
      isArtifact: true,
    };
  }

  /* ---------- GEAR SET ---------- */
  if (subSlotIndex === 3) {
    const gearSetData = getGearSetInfo(item);

    if (!gearSetData || !gearSetData.stats.length) {
      return {
        title: "Gear Set",
        stats: [{ type: "text", content: "No gear set selected" }],
        isGearSet: true,
      };
    }

    return {
      title: gearSetData.title,
      stats: gearSetData.stats,
      isGearSet: true,
      isMultiSet: gearSetData.isMultiSet,
    };
  }

  return null;
}, [
  subSlotIndex,
  heroDetails,
  item,
  stars,
  advancement,
  allArtifacts,
  formatUWUTDescription,
  getGearSetInfo,
  getAdvancementString,
]);

const overlayInfo = getOverlayInfo();



  /* =========================
     POSITIONING (INCHANGÉ)
  ========================= */

  useLayoutEffect(() => {
  if (!slotRef?.current) return;

    const rect = slotRef.current.getBoundingClientRect();
    const margin = 10;

    let x = rect.left + rect.width / 2;
    let y = rect.top - margin;
    let transform = "translateX(-50%) translateY(-100%)";

    if (y < 0) {
      y = rect.bottom + margin;
      transform = "translateX(-50%)";
    }

    setPosition({ x, y, transform });
    setIsCalculated(true);
  }, [slotRef, subSlotIndex]);

  /* =========================
     RENDER
     (UI STRICTEMENT IDENTIQUE)
  ========================= */

  if (!overlayInfo) return null;

  const borderClass = getBorderClassForOverlay();

  return (
    <div
      ref={overlayRef}
      className={`subslot-overlay ${borderClass}`}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        transform: position.transform,
        zIndex: 999999,
        opacity: isCalculated ? 1 : 0,
      }}
      onMouseEnter={(e) => {
        e.stopPropagation();
        onMouseEnter?.();
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        onMouseLeave?.();
      }}
    >
      <div className="subslot-overlay-content">
        <div className="subslot-overlay-header">
          {!overlayInfo.isGearSet && (
            <div className="subslot-overlay-stars">
              {typeof overlayInfo.stats[0] === "object"
                ? overlayInfo.stats[0].content
                : overlayInfo.stats[0]}
            </div>
          )}

          {overlayInfo.title && (
            <div className="subslot-overlay-title">{overlayInfo.title}</div>
          )}

          {overlayInfo.isUW &&
            advancement !== null &&
            advancement !== undefined && (
              <img
                src={getAdvancementIconPath(advancement)}
                alt=""
                className="subslot-advancement-icon"
              />
            )}
        </div>

        <div className="subslot-overlay-stats">
          {overlayInfo.isGearSet
            ? overlayInfo.stats.map((stat, i) => (
                <div key={i} className="subslot-text">
                  {stat.description2P && (
                    <div>
                      <strong>2P:</strong> {stat.description2P}
                    </div>
                  )}
                  {stat.description4P && (
                    <div>
                      <strong>4P:</strong> {stat.description4P}
                    </div>
                  )}
                </div>
              ))
            : overlayInfo.stats.slice(1).map((stat, i) => {
                if (typeof stat === "string") {
                  return (
                    <div key={i} className="subslot-text">
                      {stat}
                    </div>
                  );
                }

                if (stat.type === "formatted") {
                  return (
                    <div key={i} className="subslot-formatted">
                      {stat.content.map((p, j) =>
                        p.type === "value" ? (
                          <span key={j} className="subslot-value">
                            {p.content}
                          </span>
                        ) : (
                          <span key={j}>{p.content}</span>
                        )
                      )}
                    </div>
                  );
                }

                return (
                  <div key={i} className="subslot-text">
                    {stat.content}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};

export default SubSlotOverlay;
