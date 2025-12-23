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
  const [overlayInfo, setOverlayInfo] = useState(null);
  const [heroDetails, setHeroDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { getHeroBySlug, loadHeroDetails } = useHeroContext();
  const { allArtifacts, getArtifactBySlug } = useArtifacts();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

  // Charger les détails du héros
  useEffect(() => {
    const loadHeroData = async () => {
      if (!heroSlug) return;
      
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
  }, [heroSlug, loadHeroDetails]);

  // Fonction de formatage pour UW, UT et ARTIFACT - CORRIGÉE
  const formatUWUTDescription = useCallback((description, values, starLevel) => {
    if (!description) return [{ type: "text", content: "No description available" }];
    if (!values || Object.keys(values).length === 0) {
      return [{ type: "text", content: description }];
    }

    let parts = [];
    let currentText = description;

    // Pour les artefacts, les valeurs sont au format "2%, 2.4%, 2.8%, 3.4%, 4.2%, 5%"
    // Pour UW/UT, c'est souvent au format { "0": "10%", "1": "12%", ... }
    
    Object.keys(values).forEach((key) => {
      const valueObj = values[key];
      let selectedValue;
      
      if (typeof valueObj === 'string') {
        // Format artefact: "2%, 2.4%, 2.8%, 3.4%, 4.2%, 5%"
        const valueArray = valueObj.split(",").map(v => v.trim());
        // starLevel peut être de 0 à 5, correspondant aux 6 valeurs
        const valueIndex = Math.min(starLevel, valueArray.length - 1);
        selectedValue = valueArray[valueIndex] || valueArray[0];
      } else if (typeof valueObj === 'object') {
        // Format UW/UT: { "0": "10%", "1": "12%", ... }
        selectedValue = valueObj[starLevel.toString()] || valueObj["0"];
      } else {
        selectedValue = "N/A";
      }

      const placeholder = `(${key})`;
      const partsArray = currentText.split(placeholder);
      
      if (partsArray.length > 1) {
        if (partsArray[0]) {
          parts.push({ type: "text", content: partsArray[0] });
        }
        parts.push({ type: "value", content: selectedValue });
        currentText = partsArray.slice(1).join(placeholder);
      }
    });

    if (currentText) {
      parts.push({ type: "text", content: currentText });
    }

    return parts.length > 0 ? parts : [{ type: "text", content: description }];
  }, []);

  // Getters d'information d'overlay
  const getOverlayInfo = useCallback(() => {
    if (!item) return null;

    // GearSet (slot 3)
    if (subSlotIndex === 3) {
      if (typeof item === 'object' && item.gearSetSlug) {
        const gearSetSlug = item.gearSetSlug;
        const pieces = item.pieces || 0;
        
        const stats = [];
        
        stats.push({
          type: "gearset_header",
          content: `${item.gearSetInfo?.name || gearSetSlug} (${pieces}P)`,
          isSingle: true,
        });

        if (item.gearSetInfo?.bonus2P) {
          stats.push({
            type: "gearset_bonus",
            content: item.gearSetInfo.bonus2P,
            level: "2P",
          });
        }

        if (item.gearSetInfo?.bonus4P && pieces >= 4) {
          stats.push({
            type: "gearset_bonus",
            content: item.gearSetInfo.bonus4P,
            level: "4P",
          });
        }

        return {
          title: item.gearSetInfo?.name || gearSetSlug,
          stats: stats,
        };
      }
    }

    // UW (slot 0)
    if (subSlotIndex === 0 && heroDetails) {
      if (!heroDetails.uw) {
        return {
          title: "Unique Weapon",
          stats: [
            `${stars}★`,
            { 
              type: "text", 
              content: advancement !== "none" ? 
                `Soul Weapon: ${advancement}` : 
                "No Soul Weapon" 
            }
          ],
          isUW: true,
          advancement: advancement,
        };
      }

      const formattedDescription = formatUWUTDescription(
        heroDetails.uw.description || "",
        heroDetails.uw.value || heroDetails.uw.values || {},
        stars
      );

      const stats = [
        `${stars}★`,
        { type: "formatted", content: formattedDescription },
      ];

      if (advancement !== "none" && heroDetails.sw) {
        const advancementColor = {
          blue: "#2175bb",
          purple: "#ae4f99",
          red: "#cc2615",
        }[advancement] || "#ae4f99";

        stats.push({
          type: "separator",
          content: "Soul Weapon",
          color: advancementColor,
        });

        if (heroDetails.sw.description) {
          stats.push({ 
            type: "text", 
            content: heroDetails.sw.description 
          });
        }

        if (heroDetails.sw.advancement) {
          Object.entries(heroDetails.sw.advancement).forEach(([level, description]) => {
            const isSelected = (level === "1" && (advancement === "purple" || advancement === "red")) ||
                              (level === "2" && advancement === "red");
            
            const levelColor = level === "1" ? "#ae4f99" : "#cc2615";

            stats.push({
              type: "sw_advancement",
              content: description,
              isSelected: isSelected,
              level: `A${level}`,
              color: levelColor,
            });
          });
        }

        if (heroDetails.sw.cooldown) {
          stats.push({
            type: "cooldown",
            content: `Cooldown: ${heroDetails.sw.cooldown}s`,
          });
        }
      }

      return {
        title: heroDetails.uw.name || "Unique Weapon",
        stats: stats,
        isUW: true,
        advancement: advancement,
      };
    }

    // UT (slot 1)
    if (subSlotIndex === 1 && heroDetails) {
      let utNumber = 1;
      if (typeof item === 'object' && item.choice) {
        utNumber = item.choice;
      }

      const utData = heroDetails.uts?.[utNumber];
      
      if (!utData) {
        return {
          title: `Unique Treasure ${utNumber}`,
          stats: [
            `${stars}★`,
            { type: "text", content: "No UT data available" }
          ],
          isUT: true,
        };
      }

      const formattedDescription = formatUWUTDescription(
        utData.description || "",
        utData.value || utData.values || {},
        stars
      );

      return {
        title: utData.name || `UT${utNumber}`,
        stats: [
          `${stars}★`,
          { type: "formatted", content: formattedDescription },
        ],
        isUT: true,
      };
    }

    // Artifact (slot 2) - CORRIGÉ pour utiliser la même logique que UT
    if (subSlotIndex === 2) {
      let artifactSlug = "";
      let artifactInfo = null;
      
      if (typeof item === 'object') {
        if (item.artifactSlug) {
          artifactSlug = item.artifactSlug;
          artifactInfo = item.artifactInfo;
        }
      }

      if (!artifactSlug) {
        return {
          title: "Artifact",
          stats: [
            `${stars}★`,
            { type: "text", content: "No artifact selected" }
          ],
          isArtifact: true,
        };
      }

      // Chercher l'artefact dans la liste
      let artifactData = null;
      
      if (allArtifacts && allArtifacts.length > 0) {
        artifactData = allArtifacts.find(a => a && a.slug === artifactSlug);
      }

      // Si pas trouvé dans allArtifacts, utiliser artifactInfo
      if (!artifactData && artifactInfo) {
        artifactData = {
          name: artifactInfo.name,
          description: artifactInfo.description || "",
          value: artifactInfo.values || artifactInfo.value || {},
        };
      }

      if (!artifactData) {
        return {
          title: artifactSlug.replace(/_/g, " "),
          stats: [
            `${stars}★`,
            { type: "text", content: "Artifact data not found" }
          ],
          isArtifact: true,
        };
      }

      // Utiliser la MÊME fonction que pour UW/UT
      const formattedDescription = formatUWUTDescription(
        artifactData.description || "",
        artifactData.value || artifactData.values || {},
        stars
      );

      return {
        title: artifactData.name || artifactSlug.replace(/_/g, " "),
        stats: [
          `${stars}★`,
          { type: "formatted", content: formattedDescription },
        ],
        isArtifact: true,
      };
    }

    return null;
  }, [
    item, stars, advancement, heroDetails, 
    subSlotIndex, formatUWUTDescription,
    allArtifacts, getArtifactBySlug
  ]);

  // Mettre à jour l'overlay info
  useEffect(() => {
    if (loading) return;
    
    const info = getOverlayInfo();
    setOverlayInfo(info);
  }, [getOverlayInfo, loading]);

  // Calculer la position
  useLayoutEffect(() => {
    if (!slotRef?.current || !overlayInfo) {
      return;
    }

    const calculatePosition = () => {
      const slotRect = slotRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const estimatedWidth = 320;
      const estimatedHeight = 200;
      const margin = 10;

      let targetX = slotRect.left + slotRect.width / 2;
      let targetY = slotRect.top - margin;
      let transform = "translateX(-50%) translateY(-100%)";

      if (targetY - estimatedHeight < 0) {
        targetY = slotRect.bottom + margin;
        transform = "translateX(-50%)";
      }

      const leftEdge = targetX - estimatedWidth / 2;
      const rightEdge = targetX + estimatedWidth / 2;

      if (leftEdge < 0) {
        targetX = estimatedWidth / 2 + margin;
      } else if (rightEdge > viewportWidth) {
        targetX = viewportWidth - estimatedWidth / 2 - margin;
      }

      if (targetY + estimatedHeight > viewportHeight) {
        targetY = viewportHeight - estimatedHeight - margin;
      }

      setPosition({
        x: targetX,
        y: targetY,
        transform: transform,
      });
      setIsCalculated(true);
    };

    calculatePosition();

    const timeoutId = setTimeout(() => {
      if (overlayRef.current) {
        const overlayRect = overlayRef.current.getBoundingClientRect();
        const currentViewportHeight = window.innerHeight;
        
        if (overlayRect.bottom > currentViewportHeight) {
          setPosition(prev => ({
            ...prev,
            y: currentViewportHeight - overlayRect.height - 10
          }));
        }
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [slotRef, overlayInfo]);

  // Fonction de rendu du contenu
  const renderContent = () => {
    if (!overlayInfo) return null;

    return (
      <div className={`subslot-overlay-content ${
        overlayInfo.isUW && overlayInfo.advancement === "blue"
          ? "border-blue"
          : overlayInfo.isUW && overlayInfo.advancement === "purple"
          ? "border-purple"
          : overlayInfo.isUW && overlayInfo.advancement === "red"
          ? "border-red"
          : ""
      }`}>
        
        {/* Header */}
        <div className="subslot-overlay-header">
          <div className="subslot-overlay-stars">
            {typeof overlayInfo.stats[0] === 'object' 
              ? overlayInfo.stats[0].content 
              : overlayInfo.stats[0]}
          </div>
          
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

        {/* Contenu des stats */}
        <div className="subslot-overlay-stats">
          {(subSlotIndex === 3 ? overlayInfo.stats : overlayInfo.stats.slice(1))
            .map((stat, index) => {
              if (typeof stat === 'string') {
                return (
                  <div key={index} className="subslot-text">
                    {stat}
                  </div>
                );
              }
              
              if (stat && typeof stat === 'object') {
                switch (stat.type) {
                  case "gearset_header":
                    return (
                      <div key={`${index}-${stat.index || 0}`} className="subslot-gearset-header">
                        {stat.content}
                      </div>
                    );
                  case "gearset_bonus":
                    return (
                      <div key={`${index}-${stat.level}-${stat.index || 0}`} className="subslot-gearset-bonus">
                        <span className="gearset-bonus-level">{stat.level}:</span>
                        <span>{stat.content}</span>
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

              return null;
            })}
        </div>
      </div>
    );
  };

  // Rendu pendant le chargement
  if (loading) {
    return (
      <div
        ref={overlayRef}
        className="subslot-overlay"
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: position.transform,
          zIndex: 999999,
        }}
      >
        <div className="subslot-overlay-content">
          <div className="subslot-loading">Loading data...</div>
        </div>
      </div>
    );
  }

  // Rendu normal
  if (!overlayInfo) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className={`subslot-overlay ${
        overlayInfo.isUW && overlayInfo.advancement === "blue"
          ? "border-blue"
          : overlayInfo.isUW && overlayInfo.advancement === "purple"
          ? "border-purple"
          : overlayInfo.isUW && overlayInfo.advancement === "red"
          ? "border-red"
          : ""
      }`}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: position.transform,
        zIndex: 999999,
        opacity: isCalculated ? 1 : 0,
        transition: "opacity 0.15s ease",
        pointerEvents: "auto",
        overscrollBehavior: "contain",
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
      {renderContent()}
    </div>
  );
};

export default SubSlotOverlay;