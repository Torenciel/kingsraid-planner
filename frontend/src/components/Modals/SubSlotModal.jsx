import { useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useArtifacts } from "../../contexts/ArtifactContext";
import { useGearSets } from "../../contexts/GearSetContext";
import { useOverlay } from "../../contexts/OverlayContext";
import { useTeam } from "../../contexts/TeamContext";
import { indicesToPerks, perksToIndices } from "../../utils/perkConverter";
import ItemOverlay from "./ItemOverlay";
import StarRating from "./StarRating";
import "./ArtifactModal.css";
import "./PerkModal.css";
import "./UWModal.css";
import "./SubSlotModal.css";

const TAB_LABELS = ["UW", "UT", "Artifact", "Gear Set", "Perks"];

/* ================================================================
   LEFT PANEL — slot nav buttons
================================================================ */
const LeftPanel = ({ activeTab, setActiveTab, hero, subSlots, subStars, advancement, perks }) => {
  const getUWImagePath = () => {
    const folder = hero.name;
    return `/kingsraid-data/assets/heroes/${encodeURIComponent(folder)}/uw.png`;
  };

  const getUTImagePath = (choice) => {
    return `/kingsraid-data/assets/heroes/${encodeURIComponent(hero.name)}/ut/${choice || 1}.png`;
  };

  const getArtifactImagePath = (item) => {
    if (item?.artifactInfo?.thumbnail) {
      const filename = item.artifactInfo.thumbnail.split("/").pop();
      return `/kingsraid-data/assets/artifacts/${encodeURIComponent(filename)}`;
    }
    if (item?.artifactSlug) {
      const filename = item.artifactSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
        .replace("Years", "Year's");
      return `/kingsraid-data/assets/artifacts/${encodeURIComponent(filename)}.png`;
    }
    return "";
  };

  const getGearSetImagePath = (item) => {
    const slug = item?.gearSetSlug || item?.sets?.[0];
    if (!slug) return "";
    return `/kingsraid-data/assets/gearsets/${slug.replace(/-/g, "_")}.png`;
  };

  const hasPerks =
    perks &&
    (perks.t1?.selected?.length > 0 ||
      perks.t2?.selected?.length > 0 ||
      Object.values(perks.t3 || {}).some(Boolean) ||
      perks.t5);

  const slots = [
    { index: 0, label: "UW", img: subSlots?.[0] ? getUWImagePath() : null },
    { index: 1, label: "UT", img: subSlots?.[1] ? getUTImagePath(subSlots[1]?.choice) : null },
    { index: 2, label: "Artifact", img: subSlots?.[2] ? getArtifactImagePath(subSlots[2]) : null },
    { index: 3, label: "Gear Set", img: subSlots?.[3] ? getGearSetImagePath(subSlots[3]) : null },
    { index: 4, label: "Perks", img: null, hasPerks },
  ];

  return (
    <div className="ssm-left">
      <div className="ssm-hero-name">{hero.name}</div>
      <div className="ssm-slot-list">
        {slots.map((slot) => (
          <button
            key={slot.index}
            className={`ssm-slot-btn ${activeTab === slot.index ? "active" : ""}`}
            onClick={() => setActiveTab(slot.index)}
          >
            <div className="ssm-slot-btn-icon">
              {slot.img ? (
                <img src={slot.img} alt={slot.label} onError={(e) => { e.target.style.display = "none"; }} />
              ) : (
                <div className="ssm-slot-btn-empty">{slot.label[0]}</div>
              )}
              {slot.index === 0 && subSlots?.[0] && advancement !== null && advancement !== undefined && (
                <div className="ssm-adv-dot" data-adv={
                  advancement === 0 ? "blue" : advancement === 1 ? "purple" : "red"
                } />
              )}
              {slot.index === 3 && subSlots?.[3] && (
                <div className="ssm-pieces-badge">{subSlots[3].pieces || 4}P</div>
              )}
            </div>
            <span className="ssm-slot-btn-label">{slot.label}</span>
            {slot.hasPerks && <div className="ssm-perk-dot" />}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ================================================================
   UW PANEL
================================================================ */
const UWPanel = ({ hero, teamSlotIndex, subSlotIndex, currentItem, currentStars, currentAdvancement }) => {
  const { updateSubSlot, updateAdvancement } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();
  const [heroData, setHeroData] = useState(null);
  const [heroFullName, setHeroFullName] = useState(hero.name);
  const [isEquipped, setIsEquipped] = useState(!!currentItem);
  const [selectedStars, setSelectedStars] = useState(currentStars || 0);
  const [selectedAdvancement, setSelectedAdvancement] = useState(() => {
    const v = currentAdvancement;
    if (v === 0 || v === "0") return "0";
    if (v === 1 || v === "1") return "1";
    if (v === 2 || v === "2") return "2";
    return "null";
  });
  const [hoveredAdv, setHoveredAdv] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";
        const res = await fetch(`${API_BASE_URL}/api/v2/heroes/${hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-")}`);
        if (!res.ok) throw new Error();
        const result = await res.json();
        if (result.success && result.hero) {
          setHeroData(result.hero);
          setHeroFullName(result.hero.name || hero.name);
        }
      } catch {
        setHeroFullName(hero.name);
      }
    };
    load();
  }, [hero.slug, hero.name]);

  const uwImagePath = `/kingsraid-data/assets/heroes/${encodeURIComponent(heroFullName)}/uw.png`;

  const getUWData = () => heroData?.uw || heroData?.rawData?.uw || null;

  const handleToggle = () => {
    const next = !isEquipped;
    setIsEquipped(next);
    if (!next) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
      updateAdvancement(teamSlotIndex, null);
    } else {
      const uwObject = {
        uwPath: uwImagePath,
        heroSlug: hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-"),
        heroName: hero.name,
        stars: selectedStars,
      };
      updateSubSlot(teamSlotIndex, subSlotIndex, uwObject, selectedStars);
      const advValue = selectedAdvancement === "null" ? null : parseInt(selectedAdvancement);
      updateAdvancement(teamSlotIndex, advValue);
    }
  };

  const handleStarsChange = (stars) => {
    setSelectedStars(stars);
    if (isEquipped) {
      const uwObject = {
        uwPath: uwImagePath,
        heroSlug: hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-"),
        heroName: hero.name,
        stars,
      };
      updateSubSlot(teamSlotIndex, subSlotIndex, uwObject, stars);
    }
  };

  const handleAdvancementChange = (value) => {
    setSelectedAdvancement(value);
    if (isEquipped) {
      const advValue = value === "null" ? null : parseInt(value);
      updateAdvancement(teamSlotIndex, advValue);
    }
  };

  const handleUWHover = (e) => {
    const uwData = getUWData();
    if (!uwData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    showOverlay(
      <ItemOverlay title={uwData.name || "Unique Weapon"} stars={selectedStars} description={uwData.description || ""} values={uwData.value || {}} itemType="uw" />,
      { left: rect.left + rect.width / 2, top: rect.top, transform: "translateX(-50%) translateY(-100%)" }
    );
  };

  const advOptions = [
    { value: "null", label: "None", img: "/kingsraid-data/assets/advancements/none.png" },
    { value: "0", label: "Blue", img: "/kingsraid-data/assets/advancements/blue.png" },
    { value: "1", label: "Purple", img: "/kingsraid-data/assets/advancements/purple.png" },
    { value: "2", label: "Red", img: "/kingsraid-data/assets/advancements/red.png" },
  ];

  return (
    <div className="ssm-panel">
      <h4 className="ssm-panel-title">Unique Weapon</h4>
      <div className="ssm-uw-card-row">
        <div
          className={`ssm-uw-card ${isEquipped ? "equipped" : ""}`}
          onClick={handleToggle}
          onMouseEnter={handleUWHover}
          onMouseLeave={hideOverlay}
        >
          <img src={uwImagePath} alt="UW" onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          <div className="ssm-fallback">UW</div>
          {isEquipped && <div className="ssm-check">✓</div>}
        </div>
        <span className="ssm-uw-hint">{isEquipped ? "Click to remove" : "Click to equip"}</span>
      </div>

      <div className="ssm-section">
        <StarRating value={selectedStars} onChange={handleStarsChange} maxStars={5} showZeroOption size="medium" />
      </div>
      <div className="ssm-section">
        <h5 className="ssm-section-title">Soul Weapon</h5>
        <div className="advancement-options">
          {advOptions.map((adv) => (
            <div
              key={adv.value}
              className={`advancement-option ${selectedAdvancement === adv.value ? "selected" : ""}`}
              onClick={() => handleAdvancementChange(adv.value)}
              onMouseEnter={() => setHoveredAdv(adv.value)}
              onMouseLeave={() => setHoveredAdv(null)}
            >
              <div className="advancement-image-container">
                <img src={adv.img} alt={adv.label} className="advancement-image" onError={(e) => { e.target.style.display = "none"; }} />
                <div className="advancement-border hover-border" style={{ opacity: hoveredAdv === adv.value ? 1 : 0 }}>
                  <img src="/kingsraid-data/assets/advancements/border-hover.png" alt="" onError={(e) => { e.target.style.display = "none"; }} />
                </div>
                <div className="advancement-border selected-border" style={{ opacity: selectedAdvancement === adv.value ? 1 : 0 }}>
                  <img src="/kingsraid-data/assets/advancements/border-selected.png" alt="" onError={(e) => { e.target.style.display = "none"; }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   UT PANEL
================================================================ */
const UTPanel = ({ hero, teamSlotIndex, subSlotIndex, currentItem, currentStars }) => {
  const { updateSubSlot } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUT, setSelectedUT] = useState(() => {
    if (!currentItem) return 0;
    if (typeof currentItem === "object") return currentItem.choice || 0;
    return 0;
  });
  const [selectedStars, setSelectedStars] = useState(currentStars || 0);

  useEffect(() => {
    const load = async () => {
      const slug = hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-");
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";
        const res = await fetch(`${API_BASE_URL}/api/v2/heroes/${slug}`);
        if (!res.ok) throw new Error();
        const result = await res.json();
        if (result.success && result.hero) setHeroData(result.hero);
      } catch {
        try {
          const fallback = await fetch(`/kingsraid-data/table-data/heroes/${hero.name}.json`);
          if (fallback.ok) setHeroData(await fallback.json());
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hero.slug, hero.name]);

  const getUTData = (n) =>
    heroData?.uts?.[n] || heroData?.uts?.[n.toString()] ||
    heroData?.rawData?.uts?.[n] || heroData?.rawData?.uts?.[n.toString()] || null;

  const availableUTs = (() => {
    if (!heroData) return [1, 2, 3, 4];
    const count = heroData.utsCount || Object.keys(heroData.uts || {}).length || Object.keys(heroData.rawData?.uts || {}).length;
    return count > 0 && count < 4 ? Array.from({ length: count }, (_, i) => i + 1) : [1, 2, 3, 4];
  })();

  const handleSelect = (n) => {
    const utData = getUTData(n);
    if (!utData) return;
    const next = selectedUT === n ? 0 : n;
    setSelectedUT(next);
    if (next === 0) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      updateSubSlot(teamSlotIndex, subSlotIndex, { choice: next, stars: selectedStars }, selectedStars);
    }
  };

  const handleStarsChange = (stars) => {
    setSelectedStars(stars);
    if (selectedUT > 0) {
      updateSubSlot(teamSlotIndex, subSlotIndex, { choice: selectedUT, stars }, stars);
    }
  };

  const handleHover = (n, e) => {
    const utData = getUTData(n);
    if (!utData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    showOverlay(
      <ItemOverlay title={utData.name || `UT${n}`} stars={selectedStars} description={utData.description || ""} values={utData.value || {}} />,
      { left: rect.left + rect.width / 2, top: rect.top, transform: "translateX(-50%) translateY(-100%)" }
    );
  };

  if (loading) return <div className="ssm-panel"><div className="ssm-loading">Loading hero data...</div></div>;

  return (
    <div className="ssm-panel">
      <h4 className="ssm-panel-title">Unique Treasure</h4>
      <div className="ssm-grid">
        {availableUTs.map((n) => {
          const utData = getUTData(n);
          const isSelected = selectedUT === n;
          return (
            <div
              key={n}
              className={`ssm-item ${isSelected ? "selected" : ""} ${!utData ? "unavailable" : ""}`}
              onClick={() => handleSelect(n)}
              onMouseEnter={(e) => utData && handleHover(n, e)}
              onMouseLeave={hideOverlay}
            >
              <img src={`/kingsraid-data/assets/heroes/${hero.name}/ut/${n}.png`} alt={`UT${n}`} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
              <div className="ssm-fallback">UT{n}</div>
              {isSelected && <div className="ssm-check">✓</div>}
              {!utData && <div className="ssm-unavailable">N/A</div>}
            </div>
          );
        })}
      </div>
      <div className="ssm-section">
        <StarRating value={selectedStars} onChange={handleStarsChange} maxStars={5} showZeroOption />
      </div>
    </div>
  );
};

/* ================================================================
   ARTIFACT PANEL
================================================================ */
const ArtifactPanel = ({ teamSlotIndex, subSlotIndex, currentItem, currentStars }) => {
  const { updateSubSlot } = useTeam();
  const { allArtifacts, loading, getArtifactPublicUrl } = useArtifacts();
  const { showOverlay, hideOverlay } = useOverlay();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [selectedStars, setSelectedStars] = useState(currentStars || 0);

  useEffect(() => {
    if (!allArtifacts?.length || !currentItem) return;
    let found = null;
    if (currentItem.artifactSlug) found = allArtifacts.find((a) => a.slug === currentItem.artifactSlug);
    if (!found && currentItem.slug) found = allArtifacts.find((a) => a.slug === currentItem.slug);
    if (found) setSelectedArtifact(found);
  }, [allArtifacts, currentItem]);

  const displayed = searchTerm
    ? allArtifacts.filter((a) => (a.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (a.slug || "").toLowerCase().includes(searchTerm.toLowerCase()))
    : allArtifacts;

  const isSelected = (a) => {
    if (!selectedArtifact || !a) return false;
    if (selectedArtifact.slug && a.slug) return selectedArtifact.slug === a.slug;
    return false;
  };

  const handleSelect = (artifact) => {
    const next = isSelected(artifact) ? null : artifact;
    setSelectedArtifact(next);
    if (!next) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      updateSubSlot(teamSlotIndex, subSlotIndex, {
        artifactSlug: next.slug || next._id?.toString(),
        artifactInfo: { name: next.name, thumbnail: next.thumbnail, description: next.description || "" },
        stars: selectedStars,
      }, selectedStars);
    }
  };

  const handleStarsChange = (stars) => {
    setSelectedStars(stars);
    if (selectedArtifact) {
      updateSubSlot(teamSlotIndex, subSlotIndex, {
        artifactSlug: selectedArtifact.slug || selectedArtifact._id?.toString(),
        artifactInfo: { name: selectedArtifact.name, thumbnail: selectedArtifact.thumbnail, description: selectedArtifact.description || "" },
        stars,
      }, stars);
    }
  };

  const handleHover = (artifact, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    showOverlay(
      <ItemOverlay title={artifact.name} stars={selectedStars} description={artifact.description || ""} values={artifact.values || artifact.value || {}} itemType="artifact" />,
      { left: rect.left + rect.width / 2, top: rect.top, transform: "translateX(-50%) translateY(-100%)" }
    );
  };

  return (
    <div className="ssm-panel">
      <h4 className="ssm-panel-title">Artifact</h4>
      <div className="artifact-search-container">
        <FaSearch className="artifact-search-icon" />
        <input className="artifact-search-input" type="text" placeholder="Search artifacts" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      {loading && allArtifacts.length === 0 ? (
        <div className="ssm-loading">Loading artifacts...</div>
      ) : (
        <>
          <div className="ssm-grid ssm-grid-wide">
            {displayed.map((artifact) => (
              <div
                key={artifact.slug || artifact._id}
                className={`ssm-item ${isSelected(artifact) ? "selected" : ""}`}
                onClick={() => handleSelect(artifact)}
                onMouseEnter={(e) => handleHover(artifact, e)}
                onMouseLeave={hideOverlay}
              >
                <img src={getArtifactPublicUrl(artifact)} alt={artifact.name} />
                <div className="ssm-fallback">{(artifact.name || "").substring(0, 6)}</div>
                {isSelected(artifact) && <div className="ssm-check">✓</div>}
              </div>
            ))}
          </div>
          {searchTerm && displayed.length === 0 && <div className="ssm-empty">No results for "{searchTerm}"</div>}
        </>
      )}
      <div className="ssm-section">
        <StarRating value={selectedStars} onChange={handleStarsChange} maxStars={5} showZeroOption />
      </div>
    </div>
  );
};

/* ================================================================
   GEAR SET PANEL
================================================================ */
const GearSetPanel = ({ teamSlotIndex, subSlotIndex, currentItem }) => {
  const { updateSubSlot } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();
  const { allGearSets, loading, getGearSetBySlug, getGearSetImageUrl } = useGearSets();

  const getInitialSelection = () => {
    if (!currentItem) return [];
    if (currentItem.isMultiSet && currentItem.sets) return currentItem.sets;
    if (currentItem.gearSetSlug) return [currentItem.gearSetSlug];
    if (currentItem.sets && Array.isArray(currentItem.sets)) return currentItem.sets;
    return [];
  };

  const [selectedSets, setSelectedSets] = useState(getInitialSelection);

  const buildGearSetObject = (slugs) => {
    if (slugs.length === 0) return null;
    if (slugs.length === 1) {
      const gs = getGearSetBySlug(slugs[0]);
      if (!gs) return null;
      return { gearSetSlug: gs.slug, gearSetInfo: { name: gs.name, thumbnail: getGearSetImageUrl(gs), bonus2P: gs.bonus2P, bonus4P: gs.bonus4P }, pieces: 4, sets: [gs.slug] };
    }
    const gs1 = getGearSetBySlug(slugs[0]);
    const gs2 = getGearSetBySlug(slugs[1]);
    if (!gs1 || !gs2) return null;
    return {
      isMultiSet: true, sets: [gs1.slug, gs2.slug], gearSetSlug: gs1.slug,
      gearSetInfo: { name: `${gs1.name} + ${gs2.name}`, thumbnail: getGearSetImageUrl(gs1), bonus2P: "Multiple sets selected", bonus4P: "Not applicable" },
      pieces: 2,
      set1Info: { name: gs1.name, slug: gs1.slug, bonus2P: gs1.bonus2P },
      set2Info: { name: gs2.name, slug: gs2.slug, bonus2P: gs2.bonus2P },
    };
  };

  const handleSetClick = (slug) => {
    let next;
    if (selectedSets.includes(slug)) {
      next = selectedSets.filter((s) => s !== slug);
    } else if (selectedSets.length < 2) {
      next = [...selectedSets, slug];
    } else {
      return;
    }
    setSelectedSets(next);
    const data = buildGearSetObject(next);
    updateSubSlot(teamSlotIndex, subSlotIndex, data, 0);
  };

  const handleHover = (gs, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isSelected = selectedSets.includes(gs.slug);
    const pieces = selectedSets.length === 0 || (selectedSets.length === 1 && !isSelected) ? 4 : 2;
    showOverlay(
      <div className="gearset-hover-overlay">
        <h4 className="hover-title">{gs.name}</h4>
        <div className="hover-bonus-row"><span className="hover-bonus-label">2P : </span><span className="subslot-text">{gs.bonus2P}</span></div>
        <div className="hover-bonus-row"><span className="hover-bonus-label">4P : </span><span className={`subslot-text ${pieces >= 4 ? "active" : "inactive"}`}>{gs.bonus4P}</span></div>
      </div>,
      { left: rect.left + rect.width / 2, top: rect.top, transform: "translateX(-50%) translateY(-100%)" }
    );
  };

  const sorted = [...allGearSets].sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));

  if (loading) return <div className="ssm-panel"><div className="ssm-loading">Loading gear sets...</div></div>;

  return (
    <div className="ssm-panel">
      <h4 className="ssm-panel-title">Gear Set {selectedSets.length > 0 ? `(${selectedSets.length}/2)` : ""}</h4>

      {selectedSets.length > 0 && (
        <div className="ssm-gearset-bonus">
          {selectedSets.map((slug) => {
            const gs = getGearSetBySlug(slug);
            if (!gs) return null;
            return (
              <div key={slug} className="ssm-gearset-bonus-item">
                <div className="ssm-gearset-bonus-name">{gs.name}</div>
                <div className="ssm-gearset-bonus-row"><span>2P:</span> {gs.bonus2P}</div>
                {selectedSets.length === 1 && <div className="ssm-gearset-bonus-row active"><span>4P:</span> {gs.bonus4P}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div className="ssm-grid ssm-grid-wide">
        {sorted.map((gs) => {
          const isSel = selectedSets.includes(gs.slug);
          const isDisabled = selectedSets.length >= 2 && !isSel;
          const selIdx = isSel ? selectedSets.indexOf(gs.slug) + 1 : 0;
          return (
            <div
              key={gs.slug}
              className={`ssm-item ${isSel ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
              onClick={() => !isDisabled && handleSetClick(gs.slug)}
              onMouseEnter={(e) => handleHover(gs, e)}
              onMouseLeave={hideOverlay}
            >
              <img src={getGearSetImageUrl(gs)} alt={gs.name} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
              <div className="ssm-fallback">{gs.name.substring(0, 6)}</div>
              {isSel && <div className="ssm-check">{selectedSets.length === 1 ? "✓" : selIdx}</div>}
              {isDisabled && <div className="ssm-unavailable">×</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================================================================
   PERKS PANEL
================================================================ */
const PerksPanel = ({ hero, teamSlotIndex }) => {
  const { updatePerks, perks } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [usedPoints, setUsedPoints] = useState(0);
  const [perkData, setPerkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const maxPoints = 95;

  const heroClass = hero.role;
  const heroName = hero.name;
  const heroSlug = hero.slug || hero.name?.toLowerCase();

  useEffect(() => {
    const heroPerks = perks[teamSlotIndex];
    if (heroPerks) setSelectedIndices(perksToIndices(heroPerks, heroClass, heroName));
    else setSelectedIndices([]);
  }, [teamSlotIndex, perks, heroClass, heroName]);

  useEffect(() => {
    const layout = [{ cost: 10 }, { cost: 15 }, { cost: 15 }, { cost: 15 }, { cost: 15 }];
    let total = 0;
    if (Array.isArray(selectedIndices)) {
      selectedIndices.forEach((idx) => {
        const row = Math.floor(idx / 10);
        total += layout[row]?.cost || 0;
      });
    }
    setUsedPoints(total);
  }, [selectedIndices]);

  useEffect(() => {
    const load = async () => {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";
        const res = await fetch(`${API_BASE_URL}/api/v2/perks`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.perks) setPerkData(result.perks);
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const findPerk = (perkImageInfo, rowIndex) => {
    if (!perkImageInfo || perkData.length === 0) return null;
    const { name, file, tier, skill, type } = perkImageInfo;
    let found = perkData.find((p) => p.thumbnail === file);
    if (found) return found;
    found = perkData.find((p) => p.thumbnail === `heroes/${heroName}/perks/${file}`);
    if (found) return found;
    if (tier === "t3" || tier === "t5") {
      found = perkData.find((p) => p.heroSlug === heroSlug && p.tier === tier && p.skillIndex === skill && p.type === type);
      if (found) return found;
    }
    const searchName = name.toLowerCase();
    return perkData.find((p) => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase())) || null;
  };

  const getPerkImageInfo = (rowIndex, perkIndex, globalIndex) => {
    if (rowIndex === 0) {
      const T1 = [
        { name: "ATK Up", file: "ATK Up.png", tier: "t1", index: globalIndex },
        { name: "HP Up", file: "HP Up.png", tier: "t1", index: globalIndex },
        { name: "DEF up", file: "DEF up.png", tier: "t1", index: globalIndex },
        { name: "Crit Resist Up", file: "Crit Resist Up.png", tier: "t1", index: globalIndex },
        { name: "Monster Hunting", file: "Monster Hunting.png", tier: "t1", index: globalIndex },
      ];
      return perkIndex < T1.length ? T1[perkIndex] : null;
    }
    if (rowIndex === 1 && heroClass) {
      const T2 = {
        Knight: [
          { name: "Experienced Fighter", file: "Experienced Fighter.png", tier: "t2", index: globalIndex },
          { name: "Excellent Strategy", file: "Excellent Strategy.png", tier: "t2", index: globalIndex },
          { name: "Battle Cry", file: "Battle Cry.png", tier: "t2", index: globalIndex },
          { name: "Shield of Protection", file: "Shield of Protection.png", tier: "t2", index: globalIndex },
          { name: "Swift Move", file: "Swift Move.png", tier: "t2", index: globalIndex },
        ],
        Warrior: [
          { name: "Opportune Strike", file: "Opportune Strike.png", tier: "t2", index: globalIndex },
          { name: "Warlike", file: "Warlike.png", tier: "t2", index: globalIndex },
          { name: "Offensive Guard", file: "Offensive Guard.png", tier: "t2", index: globalIndex },
          { name: "Tactical Foresight", file: "Tactical Foresight.png", tier: "t2", index: globalIndex },
          { name: "Blood Wrath", file: "Blood Wrath.png", tier: "t2", index: globalIndex },
        ],
        Assassin: [
          { name: "Target Weakness", file: "Target Weakness.png", tier: "t2", index: globalIndex },
          { name: "Swift and Nimble", file: "Swift and Nimble.png", tier: "t2", index: globalIndex },
          { name: "Tactical Foresight", file: "Tactical Foresight.png", tier: "t2", index: globalIndex },
          { name: "Opportune Strike", file: "Opportune Strike.png", tier: "t2", index: globalIndex },
          { name: "Vital Detection", file: "Vital Detection.png", tier: "t2", index: globalIndex },
        ],
        Mechanic: [
          { name: "Target Weakness", file: "Target Weakness.png", tier: "t2", index: globalIndex },
          { name: "Ready Cannons", file: "Ready Cannons.png", tier: "t2", index: globalIndex },
          { name: "Pressure Point", file: "Pressure Point.png", tier: "t2", index: globalIndex },
          { name: "Special Bullet", file: "Special Bullet.png", tier: "t2", index: globalIndex },
          { name: "Amplified Gunpowder", file: "Amplified Gunpowder.png", tier: "t2", index: globalIndex },
        ],
        Archer: [
          { name: "Precision Shot", file: "Precision Shot.png", tier: "t2", index: globalIndex },
          { name: "Eagle Eye", file: "Eagle Eye.png", tier: "t2", index: globalIndex },
          { name: "Mortal Wound", file: "Mortal Wound.png", tier: "t2", index: globalIndex },
          { name: "Opportune Strike", file: "Opportune Strike.png", tier: "t2", index: globalIndex },
          { name: "Concentration", file: "Concentration.png", tier: "t2", index: globalIndex },
        ],
        Wizard: [
          { name: "Deception", file: "Deception.png", tier: "t2", index: globalIndex },
          { name: "Moral Rise", file: "Moral Rise.png", tier: "t2", index: globalIndex },
          { name: "Blessing of Mana", file: "Blessing of Mana.png", tier: "t2", index: globalIndex },
          { name: "Circuit Burst", file: "Circuit Burst.png", tier: "t2", index: globalIndex },
          { name: "Destruction", file: "Destruction.png", tier: "t2", index: globalIndex },
        ],
        Priest: [
          { name: "Vengeful Curse", file: "Vengeful Curse.png", tier: "t2", index: globalIndex },
          { name: "Goddess Blessing", file: "Goddess Blessing.png", tier: "t2", index: globalIndex },
          { name: "Inner Peace", file: "Inner Peace.png", tier: "t2", index: globalIndex },
          { name: "Blessing of Mana", file: "Blessing of Mana.png", tier: "t2", index: globalIndex },
          { name: "Swiftness", file: "Swiftness.png", tier: "t2", index: globalIndex },
        ],
      };
      const cls = T2[heroClass];
      return cls && perkIndex < cls.length ? cls[perkIndex] : null;
    }
    if (rowIndex >= 2 && heroName) {
      const rows = {
        2: [
          { name: "Skill 1 Light", file: "s1l.png", tier: "t3", skill: 1, type: "light", index: globalIndex },
          { name: "Skill 1 Dark", file: "s1d.png", tier: "t3", skill: 1, type: "dark", index: globalIndex },
          { name: "Skill 2 Light", file: "s2l.png", tier: "t3", skill: 2, type: "light", index: globalIndex },
          { name: "Skill 2 Dark", file: "s2d.png", tier: "t3", skill: 2, type: "dark", index: globalIndex },
        ],
        3: [
          { name: "Skill 3 Light", file: "s3l.png", tier: "t3", skill: 3, type: "light", index: globalIndex },
          { name: "Skill 3 Dark", file: "s3d.png", tier: "t3", skill: 3, type: "dark", index: globalIndex },
          { name: "Skill 4 Light", file: "s4l.png", tier: "t3", skill: 4, type: "light", index: globalIndex },
          { name: "Skill 4 Dark", file: "s4d.png", tier: "t3", skill: 4, type: "dark", index: globalIndex },
        ],
        4: [
          { name: "Light Transcendence", file: "light.png", tier: "t5", skill: null, type: "light", index: globalIndex },
          { name: "Dark Transcendence", file: "dark.png", tier: "t5", skill: null, type: "dark", index: globalIndex },
        ],
      };
      const row = rows[rowIndex];
      return row && perkIndex < row.length ? row[perkIndex] : null;
    }
    return null;
  };

  const getCost = (rowIndex) => [10, 15, 15, 15, 15][rowIndex] || 15;

  const togglePerk = (perkIndex, cost) => {
    if (!Array.isArray(selectedIndices)) return;
    const isOn = selectedIndices.includes(perkIndex);
    const newPoints = isOn ? usedPoints - cost : usedPoints + cost;
    if (newPoints > maxPoints && !isOn) {
      alert(`Cannot select this perk! You would exceed the ${maxPoints} point limit.`);
      return;
    }
    const next = isOn ? selectedIndices.filter((p) => p !== perkIndex) : [...selectedIndices, perkIndex];
    setSelectedIndices(next);
    updatePerks(teamSlotIndex, indicesToPerks(next, heroClass, heroName));
  };

  const handleHover = (perkImageInfo, rowIndex, e) => {
    if (!perkImageInfo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cost = getCost(rowIndex);
    const perkInfo = findPerk(perkImageInfo, rowIndex);
    let displayName = perkInfo?.name || perkImageInfo.name || "Unknown Perk";
    if (perkImageInfo.tier === "t3") {
      const typeName = perkImageInfo.type === "light" ? "Light" : "Dark";
      displayName = `Skill ${perkImageInfo.skill} - ${typeName}`;
    } else if (perkImageInfo.tier === "t5") {
      displayName = `${perkImageInfo.type === "light" ? "Light" : "Dark"} Transcendence`;
    }
    const description = perkInfo?.description || perkImageInfo?.effect || "No description available";
    showOverlay(
      <div className="perk-overlay">
        <h4 className="perk-title">{displayName}</h4>
        <p className="perk-description">{description}</p>
      </div>,
      { left: rect.left + rect.width / 2, top: rect.top - 10, transform: "translateX(-50%) translateY(-100%)" }
    );
  };

  const encodeHeroName = (name) => name ? encodeURIComponent(name.trim()) : "unknown";

  const getImagePath = (rowIndex, perkImageInfo) => {
    if (!perkImageInfo) return "";
    if (rowIndex === 0) return `/kingsraid-data/assets/perks/t1/${perkImageInfo.file}`;
    if (rowIndex === 1 && heroClass) return `/kingsraid-data/assets/perks/t2/${heroClass.toLowerCase()}/${perkImageInfo.file}`;
    if (rowIndex >= 2 && heroName) return `/kingsraid-data/assets/heroes/${encodeHeroName(heroName)}/perks/${perkImageInfo.file}`;
    return "";
  };

  const perkLayout = [
    { count: 5, cost: 10 },
    { count: 5, cost: 15 },
    { count: 4, cost: 15 },
    { count: 4, cost: 15 },
    { count: 2, cost: 15 },
  ];

  if (loading) return <div className="ssm-panel"><div className="ssm-loading">Loading perks...</div></div>;

  return (
    <div className="ssm-panel">
      <h4 className="ssm-panel-title">Perks</h4>
      <div className={`perk-modal-points ${usedPoints > maxPoints ? "over-limit" : ""}`}>
        Points used: <span>{usedPoints}</span> / {maxPoints}
      </div>
      <div className="perk-modal-grid">
        {perkLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="perk-modal-row">
            {Array.from({ length: row.count }, (_, i) => {
              const globalIndex = rowIndex * 10 + i;
              const isOn = selectedIndices.includes(globalIndex);
              const perkImageInfo = getPerkImageInfo(rowIndex, i, globalIndex);
              const imgPath = getImagePath(rowIndex, perkImageInfo);
              return (
                <div
                  key={globalIndex}
                  className={`perk-modal-option ${isOn ? "selected" : ""}`}
                  onClick={() => togglePerk(globalIndex, row.cost)}
                  onMouseEnter={(e) => handleHover(perkImageInfo, rowIndex, e)}
                  onMouseLeave={hideOverlay}
                >
                  {perkImageInfo ? (
                    <>
                      <img src={imgPath} alt={perkImageInfo.name} className="perk-image" style={{ opacity: isOn ? 1 : 0.4 }} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                      <div className="perk-fallback">{perkImageInfo.name.substring(0, 6)}</div>
                    </>
                  ) : (
                    <div className="perk-cost-fallback">{row.cost}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================================================================
   ROOT — SubSlotModal
================================================================ */
const SubSlotModal = ({ data, onClose }) => {
  const { teamSlotIndex, initialTab, heroName, heroSlug, currentAdvancement } = data;
  const { subSlots, subStars, advancements, perks } = useTeam();

  const hero = { name: heroName, slug: heroSlug, role: data.heroClass };
  const slots = subSlots[teamSlotIndex] || [];
  const stars = subStars[teamSlotIndex] || [];
  const advancement = advancements[teamSlotIndex] ?? null;
  const heroPerks = perks[teamSlotIndex] || [];

  const [activeTab, setActiveTab] = useState(initialTab ?? 0);

  const renderPanel = () => {
    switch (activeTab) {
      case 0:
        return <UWPanel hero={hero} teamSlotIndex={teamSlotIndex} subSlotIndex={0} currentItem={slots[0]} currentStars={stars[0]} currentAdvancement={advancement} />;
      case 1:
        return <UTPanel hero={hero} teamSlotIndex={teamSlotIndex} subSlotIndex={1} currentItem={slots[1]} currentStars={stars[1]} />;
      case 2:
        return <ArtifactPanel teamSlotIndex={teamSlotIndex} subSlotIndex={2} currentItem={slots[2]} currentStars={stars[2]} />;
      case 3:
        return <GearSetPanel teamSlotIndex={teamSlotIndex} subSlotIndex={3} currentItem={slots[3]} />;
      case 4:
        return <PerksPanel hero={hero} teamSlotIndex={teamSlotIndex} />;
      default:
        return null;
    }
  };

  return (
    <div className="ssm-root">
      <button className="ssm-close" onClick={onClose}>✕</button>
      <LeftPanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hero={hero}
        subSlots={slots}
        subStars={stars}
        advancement={advancement}
        perks={heroPerks}
      />
      <div className="ssm-right">
        {renderPanel()}
      </div>
    </div>
  );
};

export default SubSlotModal;
