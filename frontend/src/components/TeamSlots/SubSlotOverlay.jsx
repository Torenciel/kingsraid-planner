import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import "./SubSlotOverlay.css";

const SubSlotOverlay = ({
  subSlotIndex,
  item,
  stars,
  advancement,
  heroName,
  artifactsData,
  heroesData,
  gearSetsData,
  slotRef,
}) => {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const [position, setPosition] = useState("right");
  const [calculated, setCalculated] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
  const hasMeasuredRef = useRef(false);

  // Fonctions de formatage EN PREMIER
  const formatDescription = (description, values, starLevel) => {
    if (!values) return [{ type: "text", content: description }];

    let parts = [];
    let currentText = description;

    Object.keys(values).forEach((key) => {
      const valueArray = values[key].split(", ");
      const selectedValue =
        valueArray[Math.min(starLevel, valueArray.length - 1)] || valueArray[0];

      const partsArray = currentText.split(`(${key})`);
      if (partsArray.length > 1) {
        if (partsArray[0]) {
          parts.push({ type: "text", content: partsArray[0] });
        }
        parts.push({ type: "value", content: selectedValue });
        currentText = partsArray.slice(1).join(`(${key})`);
      }
    });

    if (currentText) {
      parts.push({ type: "text", content: currentText });
    }

    return parts.length > 0 ? parts : [{ type: "text", content: description }];
  };

  const formatUWUTDescription = (description, values, starLevel) => {
    if (!values) return [{ type: "text", content: description }];

    let parts = [];
    let currentText = description;

    Object.keys(values).forEach((key) => {
      const valueObj = values[key];
      const selectedValue = valueObj[starLevel.toString()] || valueObj["0"];

      const partsArray = currentText.split(`(${key})`);
      if (partsArray.length > 1) {
        if (partsArray[0]) {
          parts.push({ type: "text", content: partsArray[0] });
        }
        parts.push({ type: "value", content: selectedValue });
        currentText = partsArray.slice(1).join(`(${key})`);
      }
    });

    if (currentText) {
      parts.push({ type: "text", content: currentText });
    }

    return parts.length > 0 ? parts : [{ type: "text", content: description }];
  };

  // Ensuite définir getOverlayInfo
  const getOverlayInfo = () => {
    if (!item) return null;

    // GearSet (slot 3)
    if (subSlotIndex === 3) {
      try {
        const gearSets = JSON.parse(item);
        const stats = [];

        if (gearSets.length === 1) {
          const set = gearSets[0];
          const gearSetData = gearSetsData.find((gs) => gs.id === set);

          if (gearSetData) {
            stats.push({
              type: "gearset_header",
              content: `${gearSetData.name} (4P)`,
              isSingle: true,
            });

            if (gearSetData.bonus2P) {
              stats.push({
                type: "gearset_bonus",
                content: gearSetData.bonus2P,
                level: "2P",
              });
            }

            if (gearSetData.bonus4P) {
              stats.push({
                type: "gearset_bonus",
                content: gearSetData.bonus4P,
                level: "4P",
              });
            }
          }

          return {
            title: gearSetData ? gearSetData.name : set.replace(/_/g, " "),
            stats: stats,
          };
        } else if (gearSets.length === 2) {
          gearSets.forEach((set) => {
            const gearSetData = gearSetsData.find((gs) => gs.id === set);

            if (gearSetData) {
              stats.push({
                type: "gearset_header",
                content: `${gearSetData.name} (2P)`,
                isSingle: false,
              });

              if (gearSetData.bonus2P) {
                stats.push({
                  type: "gearset_bonus",
                  content: gearSetData.bonus2P,
                  level: "2P",
                });
              }
            }
          });

          return {
            title: "Gear Sets",
            stats: stats,
          };
        }
      } catch (e) {
        console.error("Error parsing gear set data:", e);
        return {
          title: "Gear Set",
          stats: ["Invalid gear set data"],
        };
      }
    }

    // UW (slot 0)
    if (subSlotIndex === 0) {
      const heroData = heroesData[heroName];
      if (!heroData || !heroData.uw) {
        return {
          title: "Unique Weapon",
          stats: [
            `${stars}★`,
            advancement !== "none"
              ? `Advancement: ${advancement}`
              : "No Advancement",
          ].filter(Boolean),
        };
      }

      const formattedDescription = formatUWUTDescription(
        heroData.uw.description,
        heroData.uw.value,
        stars
      );

      const stats = [
        `${stars}★`,
        { type: "formatted", content: formattedDescription },
      ];

      if (advancement !== "none" && heroData.sw) {
        const advancementColor =
          {
            blue: "#2175bb",
            purple: "#ae4f99",
            red: "#cc2615",
          }[advancement] || "#ae4f99";

        stats.push({
          type: "separator",
          content: "Soul Weapon",
          color: advancementColor,
        });

        stats.push({ type: "text", content: heroData.sw.description });

        if (heroData.sw.advancement) {
          Object.keys(heroData.sw.advancement).forEach((advKey) => {
            const isSelected =
              (advKey === "1" &&
                (advancement === "purple" || advancement === "red")) ||
              (advKey === "2" && advancement === "red");

            const levelColor = advKey === "1" ? "#ae4f99" : "#cc2615";

            stats.push({
              type: "sw_advancement",
              content: heroData.sw.advancement[advKey],
              isSelected: isSelected,
              level: `A${advKey}`,
              color: levelColor,
            });
          });
        }

        if (heroData.sw.cooldown) {
          stats.push({
            type: "cooldown",
            content: `Cooldown: ${heroData.sw.cooldown}s`,
          });
        }
      } else if (advancement !== "none") {
        stats.push(`Advancement: ${advancement}`);
      }

      return {
        title: heroData.uw.name,
        stats: stats,
        isUW: true,
        advancement: advancement,
        hasSW: advancement !== "none" && heroData.sw,
      };
    }

    // UT (slot 1)
    if (subSlotIndex === 1) {
      const utNumber = item.split("/ut/")[1]?.split(".")[0];
      const heroData = heroesData[heroName];

      if (!heroData || !heroData.uts || !heroData.uts[utNumber]) {
        return {
          title: `Unique Treasure ${utNumber || ""}`,
          stats: [`${stars}★`],
        };
      }

      const utData = heroData.uts[utNumber];
      const utFormattedDescription = formatUWUTDescription(
        utData.description,
        utData.value,
        stars
      );

      return {
        title: utData.name,
        stats: [
          `${stars}★`,
          { type: "formatted", content: utFormattedDescription },
        ],
        isUT: true,
      };
    }

    // Artifact (slot 2)
    if (subSlotIndex === 2) {
      const artifactName = item.split("/artifacts/")[1]?.replace(".png", "");

      if (!artifactName)
        return {
          title: "Artifact",
          stats: [`${stars}★`],
        };

      const artifactData = artifactsData.find(
        (artifact) =>
          artifact.thumbnail === `artifacts/${artifactName}.png` ||
          artifact.name === artifactName.replace(/_/g, " ")
      );

      if (!artifactData)
        return {
          title: artifactName.replace(/_/g, " "),
          stats: [`${stars}★`],
        };

      const artifactFormattedDescription = formatDescription(
        artifactData.description,
        artifactData.value,
        stars
      );

      return {
        title: artifactData.name,
        stats: [
          `${stars}★`,
          { type: "formatted", content: artifactFormattedDescription },
        ],
        isArtifact: true,
      };
    }

    return null;
  };

  const overlayInfo = getOverlayInfo();

  // Mesurer la taille réelle UNE FOIS
  useLayoutEffect(() => {
    if (contentRef.current && overlayInfo && !hasMeasuredRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      const borderWidth = 2;
      const shadowMargin = 4;
      setDimensions({
        width: rect.width + borderWidth * 2 + shadowMargin,
        height: rect.height + borderWidth * 2 + shadowMargin,
      });
      hasMeasuredRef.current = true;
    }
  }, [overlayInfo]);

  // Calculer la position après avoir les dimensions
  useEffect(() => {
    if (dimensions.width !== 300 && !calculated && overlayInfo) {
      calculatePosition();
    }
  }, [dimensions, calculated, overlayInfo]);

  // Calculer la position optimale avec les dimensions réelles
  const calculatePosition = useCallback(() => {
    if (!slotRef?.current || calculated || !overlayInfo) return;

    const slotRect = slotRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const overlayWidth = dimensions.width;
    const overlayHeight = dimensions.height;
    const margin = 15;

    const spaceOnRight = viewportWidth - slotRect.right - margin;
    const spaceOnLeft = slotRect.left - margin;
    const spaceOnTop = slotRect.top - margin;
    const spaceOnBottom = viewportHeight - slotRect.bottom - margin;

    const basePosition =
      subSlotIndex === 0 || subSlotIndex === 2 ? "left" : "right";

    console.log("Espaces disponibles:", {
      left: spaceOnLeft,
      right: spaceOnRight,
      top: spaceOnTop,
      bottom: spaceOnBottom,
      basePosition,
      overlayWidth,
      overlayHeight,
      type: overlayInfo.isUW
        ? "UW"
        : overlayInfo.isUT
        ? "UT"
        : overlayInfo.isArtifact
        ? "Artifact"
        : "GearSet",
    });

    if (basePosition === "left") {
      if (spaceOnLeft >= overlayWidth) {
        setPosition("left");
        setCalculated(true);
        return;
      } else if (spaceOnRight >= overlayWidth) {
        setPosition("right");
        setCalculated(true);
        return;
      }
    } else {
      if (spaceOnRight >= overlayWidth) {
        setPosition("right");
        setCalculated(true);
        return;
      } else if (spaceOnLeft >= overlayWidth) {
        setPosition("left");
        setCalculated(true);
        return;
      }
    }

    if (spaceOnTop >= overlayHeight) {
      setPosition("top");
      setCalculated(true);
      return;
    } else if (spaceOnBottom >= overlayHeight) {
      setPosition("bottom");
      setCalculated(true);
      return;
    }

    setPosition(basePosition);
    setCalculated(true);
  }, [subSlotIndex, slotRef, calculated, dimensions, overlayInfo]);

  // Réinitialiser quand l'item change
  useEffect(() => {
    setCalculated(false);
    setDimensions({ width: 300, height: 200 });
    hasMeasuredRef.current = false;
  }, [item]);

  if (!overlayInfo) return null;

  return (
    <div
      ref={overlayRef}
      className={`subslot-overlay ${position} ${
        overlayInfo.isUW && overlayInfo.advancement === "blue"
          ? "border-blue"
          : overlayInfo.isUW && overlayInfo.advancement === "purple"
          ? "border-purple"
          : overlayInfo.isUW && overlayInfo.advancement === "red"
          ? "border-red"
          : ""
      }`}
      style={{ opacity: calculated ? 1 : 0 }}
    >
      <div
        ref={contentRef}
        className={`subslot-overlay-content ${
          overlayInfo.isUW && overlayInfo.advancement === "blue"
            ? "border-blue"
            : overlayInfo.isUW && overlayInfo.advancement === "purple"
            ? "border-purple"
            : overlayInfo.isUW && overlayInfo.advancement === "red"
            ? "border-red"
            : ""
        }`}
      >
        {subSlotIndex !== 3 && (
          <div className="subslot-overlay-header">
            <div className="subslot-overlay-stars">{overlayInfo.stats[0]}</div>
            <div className="subslot-overlay-title">{overlayInfo.title}</div>
            {overlayInfo.isUW && overlayInfo.advancement !== "none" && (
              <img
                src={`/kingsraid-data/assets/advancements/${overlayInfo.advancement}.png`}
                alt={overlayInfo.advancement}
                className="subslot-advancement-icon"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
          </div>
        )}

        <div className="subslot-overlay-stats">
          {overlayInfo.stats
            .slice(subSlotIndex === 3 ? 0 : 1)
            .map((stat, index) => {
              if (typeof stat === "object" && stat !== null) {
                switch (stat.type) {
                  case "gearset_header":
                    return (
                      <div key={index} className="subslot-gearset-header">
                        {stat.content}
                      </div>
                    );
                  case "gearset_bonus":
                    return (
                      <div key={index} className="subslot-gearset-bonus">
                        {stat.content}
                      </div>
                    );
                  case "separator":
                    return (
                      <div
                        key={index}
                        className="subslot-separator"
                        style={{ color: stat.color }}
                      >
                        {stat.content}
                      </div>
                    );
                  case "sw_advancement":
                    return (
                      <div
                        key={index}
                        className={`subslot-sw-advancement ${
                          stat.isSelected ? "selected" : "unselected"
                        }`}
                        style={{
                          color: stat.isSelected ? stat.color : "#6b7280",
                        }}
                      >
                        <span className="subslot-sw-level">{stat.level}:</span>{" "}
                        {stat.content}
                      </div>
                    );
                  case "cooldown":
                    return (
                      <div key={index} className="subslot-cooldown">
                        {stat.content}
                      </div>
                    );
                  case "text":
                    return (
                      <div key={index} className="subslot-text">
                        {stat.content}
                      </div>
                    );
                  case "formatted":
                    return (
                      <div key={index} className="subslot-formatted">
                        {stat.content.map((part, partIndex) =>
                          part.type === "value" ? (
                            <span key={partIndex} className="subslot-value">
                              {part.content}
                            </span>
                          ) : (
                            <span key={partIndex}>{part.content}</span>
                          )
                        )}
                      </div>
                    );
                  default:
                    return null;
                }
              }

              return (
                <div key={index} className="subslot-text">
                  {stat}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default SubSlotOverlay;
