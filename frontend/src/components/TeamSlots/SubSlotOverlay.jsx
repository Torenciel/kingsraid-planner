import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import "./SubSlotOverlay.css";
import { useHeroContext } from "../../contexts/HeroContext";
import { useArtifacts } from "../../contexts/ArtifactContext";

const SubSlotOverlay = ({
  subSlotIndex,
  item,
  stars,
  advancement, // 🔥 Maintenant null/0/1/2
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

  // 🔥 Fonction pour convertir null/0/1/2 en string
  const getAdvancementString = useCallback((advValue) => {
    
    if (advValue === null || advValue === undefined) {
      return "none";
    }
    if (advValue === 0) {
      return "blue";
    }
    if (advValue === 1) {
      return "purple";
    }
    if (advValue === 2) {
      return "red";
    }
    console.warn('❌ Valeur advancement inconnue:', advValue);
    return "none";
  }, []);

  // 🔥 Fonction pour obtenir le chemin de l'icône
  const getAdvancementIconPath = useCallback((advValue) => {
    const advString = getAdvancementString(advValue);
    if (advString !== "none") {
      const path = `/kingsraid-data/assets/advancements/${advString}.png`;
      return path;
    }
    return "";
  }, [getAdvancementString]);

  // 🔥 Fonction pour obtenir la classe de bordure
  const getBorderClassForOverlay = useCallback(() => {
    
    if (subSlotIndex !== 0) {
      return ""; // UW seulement
    }
    
    const advString = getAdvancementString(advancement);
    
    if (advString !== "none") {
      const borderClass = `border-${advString}`;
      return borderClass;
    }
    
    return "";
  }, [subSlotIndex, advancement, getAdvancementString]);

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

  // Fonction pour obtenir les infos des gear sets
  const getGearSetInfo = useCallback((item) => {
    if (!item) return null;
    
    const stats = [];
    let title = "";
    let isMultiSet = false;
    
    // CAS MULTIPLE : 2 gear sets (2P/2P)
    if (item.isMultiSet && item.sets && Array.isArray(item.sets)) {
      isMultiSet = true;
      
      // Si on a les infos détaillées
      if (item.set1Info && item.set2Info) {
        const setName1 = item.set1Info.name || item.sets[0];
        const setName2 = item.set2Info.name || item.sets[1];
        
        // Premier gear set avec description
        stats.push({
          type: "gear_set",
          name: setName1,
          description: item.set1Info.bonus2P || "2-piece bonus",
          pieces: "2P",
          isFirst: true,
          isMultiSet: true
        });
        
        // Deuxième gear set avec description
        stats.push({
          type: "gear_set",
          name: setName2,
          description: item.set2Info.bonus2P || "2-piece bonus",
          pieces: "2P",
          isFirst: false,
          isMultiSet: true
        });
      } else {
        // Sinon, juste afficher les slugs
        item.sets.forEach((setSlug, index) => {
          const displayName = setSlug.replace(/-/g, ' ');
          stats.push({
            type: "gear_set",
            name: displayName,
            description: "2-piece bonus active",
            pieces: "2P",
            isFirst: index === 0,
            isMultiSet: true
          });
        });
      }
      
      return {
        stats: stats,
        isMultiSet: true,
        title: "", // 🔥 Titre vide pour multi-sets
        pieces: null,
        isMultiSetDisplay: true
      };
    }
    
    // CAS SIMPLE : 1 gear set (TOUJOURS 4P)
    const gearSetSlug = item.gearSetSlug;
    const pieces = item.pieces || 4;
    
    const gearSetName = item.gearSetInfo?.name || 
                       gearSetSlug?.replace(/-/g, ' ') || 
                       "Unknown Gear Set";
    
    title = gearSetName;
    
    // Single gear set avec description
    const gearSetStat = {
      type: "gear_set",
      name: gearSetName,
      pieces: `${pieces}P`,
      isMultiSet: false,
      showNameInStats: false // 🔥 NE PAS afficher le nom dans les stats
    };

    // Bonus 2P
    if (item.gearSetInfo?.bonus2P) {
      gearSetStat.description2P = item.gearSetInfo.bonus2P;
    }

    // Bonus 4P
    if (item.gearSetInfo?.bonus4P) {
      gearSetStat.description4P = item.gearSetInfo.bonus4P;
    }

    stats.push(gearSetStat);

    return {
      stats: stats,
      isMultiSet: false,
      title: title,
      pieces: `${pieces}P`,
      isMultiSetDisplay: false
    };
  }, []);

  // Fonction de formatage pour UW, UT et ARTIFACT
  const formatUWUTDescription = useCallback((description, values, starLevel) => {
    if (!description) return [{ type: "text", content: "No description available" }];
    if (!values || Object.keys(values).length === 0) {
      return [{ type: "text", content: description }];
    }

    let parts = [];
    let currentText = description;

    Object.keys(values).forEach((key) => {
      const valueObj = values[key];
      let selectedValue;
      
      if (typeof valueObj === 'string') {
        const valueArray = valueObj.split(",").map(v => v.trim());
        const valueIndex = Math.min(starLevel, valueArray.length - 1);
        selectedValue = valueArray[valueIndex] || valueArray[0];
      } else if (typeof valueObj === 'object') {
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
      const gearSetData = getGearSetInfo(item);
      
      if (!gearSetData || !gearSetData.stats || gearSetData.stats.length === 0) {
        return {
          title: "Gear Set",
          stats: [
            { type: "text", content: "No gear set selected" }
          ],
          isGearSet: true,
        };
      }
      
      return {
        title: gearSetData.title,
        stats: gearSetData.stats,
        isGearSet: true,
        isMultiSet: gearSetData.isMultiSet,
        isMultiSetDisplay: gearSetData.isMultiSetDisplay,
        pieces: gearSetData.pieces,
      };
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
              content: getAdvancementString(advancement) !== "none" ? 
                `Soul Weapon: ${getAdvancementString(advancement)}` : 
                "No Soul Weapon" 
            }
          ],
          isUW: true,
          advancement: advancement,
          advancementString: getAdvancementString(advancement),
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

      // 🔥 Vérifier si advancement n'est pas null/undefined et >= 0
      if (advancement !== null && advancement !== undefined && advancement >= 0 && heroDetails.sw) {
        const advString = getAdvancementString(advancement);
        const advancementColor = {
          blue: "#2175bb",
          purple: "#ae4f99",
          red: "#cc2615",
        }[advString] || "#ae4f99";

        stats.push({
          type: "separator",
          content: `Soul Weapon (${advString})`,
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
            const isSelected = (level === "1" && (advancement >= 1)) ||
                              (level === "2" && advancement >= 2);
            
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
        advancementString: getAdvancementString(advancement),
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

    // Artifact (slot 2)
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

      let artifactData = null;
      
      if (allArtifacts && allArtifacts.length > 0) {
        artifactData = allArtifacts.find(a => a && a.slug === artifactSlug);
      }

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
    subSlotIndex, formatUWUTDescription, getGearSetInfo,
    allArtifacts, getAdvancementString
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
      
      let estimatedWidth = 320;
      let estimatedHeight = 200;
      
      if (overlayInfo.isGearSet && overlayInfo.isMultiSet) {
        estimatedHeight = 220;
      }
      
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
      <div className="subslot-overlay-content">
        {/* Header commun pour tous les types */}
        <div className="subslot-overlay-header">
          {/* NE PAS afficher les pieces/stars pour les GearSets */}
          {!overlayInfo.isGearSet && (
            <div className="subslot-overlay-stars">
              {typeof overlayInfo.stats[0] === 'object' 
                ? overlayInfo.stats[0].content 
                : overlayInfo.stats[0]}
            </div>
          )}
          {/* 🔥 Afficher le titre seulement s'il n'est pas vide */}
          {overlayInfo.title && (
            <div className="subslot-overlay-title">{overlayInfo.title}</div>
          )}
          
          
          {/* 🔥 Icône d'avancement pour UW */}
          {overlayInfo.isUW && overlayInfo.advancement !== null && 
           overlayInfo.advancement !== undefined && overlayInfo.advancement >= 0 && (
            <img
              src={getAdvancementIconPath(overlayInfo.advancement)}
              alt={overlayInfo.advancementString}
              className="subslot-advancement-icon"
              onError={(e) => {
                console.warn(`❌ SubSlotOverlay - Advancement icon failed to load: ${overlayInfo.advancementString}`);
                e.target.style.display = "none";
              }}
            />
          )}
        </div>

        {/* Contenu des stats */}
        <div className="subslot-overlay-stats">
          {overlayInfo.isGearSet ? (
            // Afficher toutes les stats pour GearSet
            overlayInfo.stats.map((stat, index) => (
              <GearSetStatRenderer key={`gear-${index}`} stat={stat} />
            ))
          ) : (
            // Pour UW/UT/Artifact, sauter les étoiles (déjà dans le header)
            overlayInfo.stats.slice(1).map((stat, index) => (
              <OtherSlotStatRenderer key={`other-${index}`} stat={stat} />
            ))
          )}
        </div>
      </div>
    );
  };

  // Composants helpers pour le rendu
  const GearSetStatRenderer = ({ stat }) => {
    if (!stat || typeof stat !== 'object') return null;
    
    switch (stat.type) {
      case "gear_set":
        // 🔥 Afficher le nom SEULEMENT pour les multi-sets
        const showNameInContent = stat.isMultiSet;
        
        return (
          <div key={`gear-${stat.name}`} className="subslot-text">
            {/* 🔥 Afficher le nom SEULEMENT pour les multi-sets */}
            {showNameInContent && (
              <div className="subslot-overlay-title">
                {stat.name}
              </div>
            )}
            
            {/* Description du bonus 2P - seulement si disponible */}
            {stat.description2P && (
              <div className="subslot-gear-description">
                <span className="subslot-bonus-level">2P :</span> {stat.description2P}
              </div>
            )}
            
            {/* Description du bonus 4P - seulement pour single set */}
            {stat.description4P && !stat.isMultiSet && (
              <div className="subslot-gear-description bonus-4p">
                <span className="subslot-bonus-level">4P :</span> {stat.description4P}
              </div>
            )}
            
            {/* Pour les multi-sets, afficher les pièces ici */}
            {stat.isMultiSet && stat.description && (
              <div className="subslot-gear-description">
                <span className="subslot-bonus-level">{stat.pieces} :</span> {stat.description}
              </div>
            )}
            
            {/* Ligne séparatrice pour multi-set (sauf pour le dernier) */}
            {stat.isFirst === false && (
              <div className="subslot-gear-separator"></div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const OtherSlotStatRenderer = ({ stat }) => {
    if (typeof stat === 'string') {
      return (
        <div className="subslot-text">{stat}</div>
      );
    }
    
    if (!stat || typeof stat !== 'object') return null;
    
    switch (stat.type) {
      case "separator":
        return (
          <div className="subslot-separator" style={{ color: stat.color }}>
            {stat.content}
          </div>
        );
      case "sw_advancement":
        return (
          <div className={`subslot-sw-advancement ${stat.isSelected ? "selected" : "unselected"}`}
               style={{ color: stat.isSelected ? stat.color : "#6b7280" }}>
            <span className="subslot-sw-level">{stat.level}:</span> {stat.content}
          </div>
        );
      case "cooldown":
        return <div className="subslot-cooldown">{stat.content}</div>;
      case "text":
        return <div className="subslot-text">{stat.content}</div>;
      case "formatted":
        return (
          <div className="subslot-formatted">
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

  const borderClass = getBorderClassForOverlay();

  return (
    <div
      ref={overlayRef}
      className={`subslot-overlay ${borderClass}`}
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