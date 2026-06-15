import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import "./SubSlotOverlay.css";
import { useHeroContext } from "../../contexts/HeroContext";
import { useArtifacts } from "../../contexts/ArtifactContext";
import { useGearSets } from "../../contexts/GearSetContext";

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
  const [overlayInfo, setOverlayInfo] = useState(null);

  const { loadHeroDetails } = useHeroContext();
  const { allArtifacts } = useArtifacts();
  const { getGearSetBySlug, parseGearSetData } = useGearSets();


  /* =========================
     ADVANCEMENT UTILS
  ========================= */

  const getAdvancementString = useCallback((adv) => {
    if (adv === 0) return "blue";
    if (adv === 1) return "purple";
    if (adv === 2) return "red";
    return "none";
  }, []);

  const getAdvancementIconPath = useCallback(
    (adv) => {
      const str = getAdvancementString(adv);
      return str !== "none"
        ? `/kingsraid-data/assets/advancements/${str}.png`
        : "";
    },
    [getAdvancementString]
  );

  const getBorderClassForOverlay = useCallback(() => {
    if (subSlotIndex !== 0) return "";
    const str = getAdvancementString(advancement);
    return str !== "none" ? `border-${str}` : "";
  }, [subSlotIndex, advancement, getAdvancementString]);

  /* =========================
     LOAD HERO DETAILS (UW / UT)
  ========================= */

  useEffect(() => {
    if (!heroSlug || heroDetails) return;

    const load = async () => {
      const details = await loadHeroDetails(heroSlug);
      setHeroDetails(details);
    };

    load();
  }, [heroSlug, heroDetails, loadHeroDetails]);

  /* =========================
     FORMAT DESCRIPTION
     UW / UT / ARTIFACT
  ========================= */

  const formatUWUTDescription = useCallback((description, values, starLevel) => {
    if (!description) {
      return [{ type: "text", content: "No description available" }];
    }

    if (!values || Object.keys(values).length === 0) {
      return [{ type: "text", content: description }];
    }

    let parts = [];
    let text = description;

    Object.keys(values).forEach((key) => {
      const raw = values[key];
      let value = "???";

      if (typeof raw === "string") {
        const arr = raw.split(",").map(v => v.trim());
        value = arr[Math.min(starLevel, arr.length - 1)] || arr[0];
      } else if (typeof raw === "object") {
        value = raw[String(starLevel)] ?? raw["0"] ?? "???";
      }

      const placeholder = `(${key})`;
      const split = text.split(placeholder);

      if (split.length > 1) {
        if (split[0]) parts.push({ type: "text", content: split[0] });
        parts.push({ type: "value", content: value });
        text = split.slice(1).join(placeholder);
      }
    });

    if (text) parts.push({ type: "text", content: text });

    return parts;
  }, []);

  /* =========================
     BUILD OVERLAY INFO
  ========================= */

  const buildOverlayInfo = useCallback(() => {
    /* ---------- UW ---------- */
    if (subSlotIndex === 0) {
      if (!heroDetails?.uw) {
        return {
          title: "Unique Weapon",
          stats: [`${stars}★`, { type: "text", content: "No UW data" }],
          isUW: true,
        };
      }

      const stats = [
        `${stars}★`,
        {
          type: "formatted",
          content: formatUWUTDescription(
            heroDetails.uw.description,
            heroDetails.uw.value,
            stars
          ),
        },
      ];

      if (
        advancement !== null &&
        advancement !== undefined &&
        heroDetails.sw
      ) {
        const advStr = getAdvancementString(advancement);
        const colors = {
          blue: "#2175bb",
          purple: "#ae4f99",
          red: "#cc2615",
        };

        stats.push({
          type: "separator",
          content: `Soul Weapon`,
          color: colors[advStr],
        });

        if (heroDetails.sw.description) {
          stats.push({
            type: "sw_description",
            content: heroDetails.sw.description,
          });
        }

        if (heroDetails.sw.advancement) {
          Object.entries(heroDetails.sw.advancement).forEach(([lvl, desc]) => {
            const isSelected =
              (lvl === "1" && advancement >= 1) ||
              (lvl === "2" && advancement >= 2);

            stats.push({
              type: "sw_advancement",
              level: `A${lvl}`,
              content: desc,
              isSelected,
              color: lvl === "1" ? "#ae4f99" : "#cc2615",
            });
          });
        }
      }

      return {
        title: heroDetails.uw.name,
        stats,
        isUW: true,
        advancement,
      };
    }

    /* ---------- UT ---------- */
    if (subSlotIndex === 1) {
      if (!heroDetails?.uts) {
        return {
          title: "Unique Treasure",
          stats: [`${stars}★`, { type: "text", content: "No UT data" }],
          isUT: true,
        };
      }

      const utIndex = item?.choice ?? 1;
      const ut = heroDetails.uts[String(utIndex)];

      if (!ut) {
        return {
          title: `Unique Treasure ${utIndex}`,
          stats: [`${stars}★`, { type: "text", content: "No UT data" }],
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
              ut.value,
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
          stats: [`${stars}★`, { type: "text", content: "No artifact selected" }],
          isArtifact: true,
        };
      }

      const artifact = allArtifacts.find(a => a.slug === item.artifactSlug);

      if (!artifact) {
        return {
          title: "Artifact",
          stats: [`${stars}★`, { type: "text", content: "Loading artifact..." }],
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
              artifact.values,
              stars
            ),
          },
        ],
        isArtifact: true,
      };
    }

    /* ---------- GEAR SET ---------- */
    if (subSlotIndex === 3) {
      if (!item) {
        return {
          title: "Gear Set",
          stats: [{ type: "text", content: "No gear set selected" }],
          isGearSet: true,
        };
      }

      const parsed = parseGearSetData(item);

      if (!parsed) {
        return {
          title: "Gear Set",
          stats: [{ type: "text", content: "Invalid gear set data" }],
          isGearSet: true,
        };
      }

      // Multi set (2P / 2P)
      if (parsed.type === "multi") {
        const stats = [];

        parsed.sets.forEach((slug) => {
          const set = getGearSetBySlug(slug);

          if (set) {
            stats.push({
              type: "separator",
              content: `${set.name} (2 Pieces)`,
            });

            if (set.bonus2P) {
              stats.push({
                type: "text",
                content: set.bonus2P,
              });
            }
          }
        });

        return {
          title: "Multiple Gear Sets",
          stats,
          isGearSet: true,
        };
      }

      // Single set
      if (parsed.type === "single") {
        const slug = parsed.sets?.[0];
        const set = getGearSetBySlug(slug);

        if (!set) {
          return {
            title: "Gear Set",
            stats: [{ type: "text", content: "Loading gear set..." }],
            isGearSet: true,
          };
        }

        const pieces = parsed.data?.pieces || 4;

        const stats = [
          {
            type: "separator",
            content: `${set.name} (${pieces} Pieces)`,
          },
        ];

        if (pieces >= 2 && set.bonus2P) {
          stats.push({
            type: "text",
            content: set.bonus2P,
          });
        }

        if (pieces >= 4 && set.bonus4P) {
          stats.push({
            type: "text",
            content: set.bonus4P,
          });
        }

        return {
          title: set.name,
          stats,
          isGearSet: true,
        };
      }
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
    getAdvancementString,
    getGearSetBySlug,
    parseGearSetData,
  ]);

  useEffect(() => {
    const info = buildOverlayInfo();
    setOverlayInfo(info);
  }, [buildOverlayInfo]);

  /* =========================
     POSITIONING
  ========================= */

  useLayoutEffect(() => {
    if (!slotRef?.current || !overlayInfo) return;

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
  }, [slotRef, overlayInfo]);

  /* =========================
     RENDER
  ========================= */

  const needsHeroDetails = subSlotIndex === 0 || subSlotIndex === 1;
  if (needsHeroDetails && !heroDetails) return null;
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
              {overlayInfo.stats[0]}
            </div>
          )}

          <div className="subslot-overlay-title">{overlayInfo.title}</div>

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
          {overlayInfo.stats.slice(1).map((stat, i) => {
            if (typeof stat === "string") {
              return <div key={i}>{stat}</div>;
            }

            if (stat.type === "formatted") {
              return (
                <div key={i} className="subslot-formatted">
                  {stat.content.map((p, j) =>
                    p.type === "value" ? (
                      <span key={j} className="subslot-value">{p.content}</span>
                    ) : (
                      <span key={j}>{p.content}</span>
                    )
                  )}
                </div>
              );
            }

            if (stat.type === "separator") {
              return (
                <div key={i} className="subslot-separator" style={{ color: stat.color }}>
                  {stat.content}
                </div>
              );
            }

            if (stat.type === "sw_description") {
              return (
                <div key={i} className="subslot-sw-description">
                  {stat.content}
                </div>
              );
            }
            
            if (stat.type === "sw_advancement") {
              return (
                <div
                  key={i}
                  className={`subslot-sw-advancement ${
                    stat.isSelected ? "selected" : "unselected"
                  }`}
                  style={{ color: stat.isSelected ? stat.color : "var(--color-text-muted)" }}
                >
                  <strong>{stat.level}:</strong> {stat.content}
                </div>
              );
            }

            return <div key={i}>{stat.content}</div>;
          })}
        </div>
      </div>
    </div>
  );
};

export default SubSlotOverlay;
