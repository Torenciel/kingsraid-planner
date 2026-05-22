// Shared panel components used by InlineSlotPanel (and optionally SubSlotModal).
// Each panel receives the hero + slot indices and reads/writes TeamContext directly.
import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useArtifacts } from "../../contexts/ArtifactContext";
import { useGearSets } from "../../contexts/GearSetContext";
import { useOverlay } from "../../contexts/OverlayContext";
import { useTeam } from "../../contexts/TeamContext";
import { indicesToPerks, perksToIndices } from "../../utils/perkConverter";
import ItemOverlay from "../Modals/ItemOverlay";
import StarRating from "../Modals/StarRating";
import "../Modals/ArtifactModal.css";
import "../Modals/PerkModal.css";
import "../Modals/UWModal.css";
import "./SlotPanels.css";

/* ================================================================
   UW PANEL
================================================================ */
export const UWPanel = ({ hero, teamSlotIndex, subSlotIndex, currentItem, currentStars, currentAdvancement }) => {
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

  const buildUWObject = (stars) => ({
    uwPath: uwImagePath,
    heroSlug: hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-"),
    heroName: hero.name,
    stars,
  });

  const handleToggle = () => {
    const next = !isEquipped;
    setIsEquipped(next);
    if (!next) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
      updateAdvancement(teamSlotIndex, null);
    } else {
      updateSubSlot(teamSlotIndex, subSlotIndex, buildUWObject(selectedStars), selectedStars);
      updateAdvancement(teamSlotIndex, selectedAdvancement === "null" ? null : parseInt(selectedAdvancement));
    }
  };

  const handleStarsChange = (stars) => {
    setSelectedStars(stars);
    if (isEquipped) updateSubSlot(teamSlotIndex, subSlotIndex, buildUWObject(stars), stars);
  };

  const handleAdvancementChange = (value) => {
    setSelectedAdvancement(value);
    if (isEquipped) updateAdvancement(teamSlotIndex, value === "null" ? null : parseInt(value));
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
    <div className="sp-panel">
      <div className="sp-uw-row">
        <div
          className={`sp-uw-card ${isEquipped ? "equipped" : ""}`}
          onClick={handleToggle}
          onMouseEnter={handleUWHover}
          onMouseLeave={hideOverlay}
        >
          <img src={uwImagePath} alt="UW" onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          <div className="sp-fallback">UW</div>
          {isEquipped && <div className="sp-check">✓</div>}
        </div>
        <span className="sp-uw-hint">{isEquipped ? "Click to remove" : "Click to equip"}</span>
      </div>

      <div className="sp-section">
        <StarRating value={selectedStars} onChange={handleStarsChange} maxStars={5} showZeroOption size="medium" />
      </div>

      <div className="sp-section">
        <h5 className="sp-section-title">Soul Weapon</h5>
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
export const UTPanel = ({ hero, teamSlotIndex, subSlotIndex, currentItem, currentStars }) => {
  const { updateSubSlot } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUT, setSelectedUT] = useState(() => {
    if (!currentItem) return 0;
    return typeof currentItem === "object" ? currentItem.choice || 0 : 0;
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
    if (!getUTData(n)) return;
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
    if (selectedUT > 0) updateSubSlot(teamSlotIndex, subSlotIndex, { choice: selectedUT, stars }, stars);
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

  if (loading) return <div className="sp-panel"><div className="sp-loading">Loading hero data...</div></div>;

  return (
    <div className="sp-panel">
      <div className="sp-grid">
        {availableUTs.map((n) => {
          const utData = getUTData(n);
          const isSel = selectedUT === n;
          return (
            <div
              key={n}
              className={`sp-item ${isSel ? "selected" : ""} ${!utData ? "unavailable" : ""}`}
              onClick={() => handleSelect(n)}
              onMouseEnter={(e) => utData && handleHover(n, e)}
              onMouseLeave={hideOverlay}
            >
              <img src={`/kingsraid-data/assets/heroes/${hero.name}/ut/${n}.png`} alt={`UT${n}`} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
              <div className="sp-fallback">UT{n}</div>
              {isSel && <div className="sp-check">✓</div>}
              {!utData && <div className="sp-unavailable">N/A</div>}
            </div>
          );
        })}
      </div>
      <div className="sp-section">
        <StarRating value={selectedStars} onChange={handleStarsChange} maxStars={5} showZeroOption />
      </div>
    </div>
  );
};

/* ================================================================
   ARTIFACT PANEL
================================================================ */
export const ArtifactPanel = ({ teamSlotIndex, subSlotIndex, currentItem, currentStars }) => {
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
    ? allArtifacts.filter((a) =>
        (a.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.slug || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allArtifacts;

  const isSel = (a) => !!(selectedArtifact?.slug && a?.slug && selectedArtifact.slug === a.slug);

  const handleSelect = (artifact) => {
    const next = isSel(artifact) ? null : artifact;
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
    <div className="sp-panel">
      <div className="artifact-search-container">
        <FaSearch className="artifact-search-icon" />
        <input
          className="artifact-search-input"
          type="text"
          placeholder="Search artifacts"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {loading && allArtifacts.length === 0 ? (
        <div className="sp-loading">Loading artifacts...</div>
      ) : (
        <>
          <div className="sp-grid sp-grid-wide">
            {displayed.map((artifact) => (
              <div
                key={artifact.slug || artifact._id}
                className={`sp-item ${isSel(artifact) ? "selected" : ""}`}
                onClick={() => handleSelect(artifact)}
                onMouseEnter={(e) => handleHover(artifact, e)}
                onMouseLeave={hideOverlay}
              >
                <img src={getArtifactPublicUrl(artifact)} alt={artifact.name} />
                <div className="sp-fallback">{(artifact.name || "").substring(0, 6)}</div>
                {isSel(artifact) && <div className="sp-check">✓</div>}
              </div>
            ))}
          </div>
          {searchTerm && displayed.length === 0 && <div className="sp-empty">No results for "{searchTerm}"</div>}
        </>
      )}
      <div className="sp-section">
        <StarRating value={selectedStars} onChange={handleStarsChange} maxStars={5} showZeroOption />
      </div>
    </div>
  );
};

/* ================================================================
   GEAR SET PANEL
================================================================ */
export const GearSetPanel = ({ teamSlotIndex, subSlotIndex, currentItem }) => {
  const { updateSubSlot } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();
  const { allGearSets, loading, getGearSetBySlug, getGearSetImageUrl } = useGearSets();

  const getInitialSelection = () => {
    if (!currentItem) return [];
    if (currentItem.isMultiSet && currentItem.sets) return currentItem.sets;
    if (currentItem.gearSetSlug) return [currentItem.gearSetSlug];
    if (Array.isArray(currentItem.sets)) return currentItem.sets;
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
    updateSubSlot(teamSlotIndex, subSlotIndex, buildGearSetObject(next), 0);
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

  if (loading) return <div className="sp-panel"><div className="sp-loading">Loading gear sets...</div></div>;

  return (
    <div className="sp-panel">

      {selectedSets.length > 0 && (
        <div className="sp-gearset-bonus">
          {selectedSets.map((slug) => {
            const gs = getGearSetBySlug(slug);
            if (!gs) return null;
            return (
              <div key={slug} className="sp-gearset-bonus-item">
                <div className="sp-gearset-bonus-name">{gs.name}</div>
                <div className="sp-gearset-bonus-row"><span>2P:</span> {gs.bonus2P}</div>
                {selectedSets.length === 1 && <div className="sp-gearset-bonus-row active"><span>4P:</span> {gs.bonus4P}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div className="sp-grid sp-grid-wide">
        {sorted.map((gs) => {
          const isSel = selectedSets.includes(gs.slug);
          const isDisabled = selectedSets.length >= 2 && !isSel;
          const selIdx = isSel ? selectedSets.indexOf(gs.slug) + 1 : 0;
          return (
            <div
              key={gs.slug}
              className={`sp-item ${isSel ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
              onClick={() => !isDisabled && handleSetClick(gs.slug)}
              onMouseEnter={(e) => handleHover(gs, e)}
              onMouseLeave={hideOverlay}
            >
              <img src={getGearSetImageUrl(gs)} alt={gs.name} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
              <div className="sp-fallback">{gs.name.substring(0, 6)}</div>
              {isSel && <div className="sp-check">{selectedSets.length === 1 ? "✓" : selIdx}</div>}
              {isDisabled && <div className="sp-unavailable">×</div>}
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
export const PerksPanel = ({ hero, teamSlotIndex }) => {
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
    const costs = [10, 15, 15, 15, 15];
    let total = 0;
    if (Array.isArray(selectedIndices)) {
      selectedIndices.forEach((idx) => { total += costs[Math.floor(idx / 10)] || 0; });
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

  const findPerk = (info) => {
    if (!info || perkData.length === 0) return null;
    const { name, file, tier, skill, type } = info;
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
    const rowIndex = Math.floor(perkIndex / 10);
    const isSkillRow = rowIndex >= 2;

    let next;
    if (isOn) {
      next = selectedIndices.filter((p) => p !== perkIndex);
    } else if (isSkillRow) {
      const sibling = perkIndex % 2 === 0 ? perkIndex + 1 : perkIndex - 1;
      const siblingIsOn = selectedIndices.includes(sibling);
      if (siblingIsOn) {
        // Free swap: remove sibling, add new — no point change.
        next = [...selectedIndices.filter((p) => p !== sibling), perkIndex];
      } else {
        // New selection: check budget.
        if (usedPoints + cost > maxPoints) return;
        next = [...selectedIndices, perkIndex];
      }
    } else {
      // t1/t2 rows: silently block if at the limit.
      if (usedPoints + cost > maxPoints) return;
      next = [...selectedIndices, perkIndex];
    }

    setSelectedIndices(next);
    updatePerks(teamSlotIndex, indicesToPerks(next, heroClass, heroName));
  };

  const handleHover = (info, rowIndex, e) => {
    if (!info) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const perkInfo = findPerk(info);
    let displayName = perkInfo?.name || info.name || "Unknown Perk";
    if (info.tier === "t3") displayName = `Skill ${info.skill} - ${info.type === "light" ? "Light" : "Dark"}`;
    else if (info.tier === "t5") displayName = `${info.type === "light" ? "Light" : "Dark"} Transcendence`;
    const description = perkInfo?.description || info?.effect || "No description available";
    showOverlay(
      <div className="perk-overlay">
        <h4 className="perk-title">{displayName}</h4>
        <p className="perk-description">{description}</p>
      </div>,
      { left: rect.left + rect.width / 2, top: rect.top - 10, transform: "translateX(-50%) translateY(-100%)" }
    );
  };

  const encodeHeroName = (name) => (name ? encodeURIComponent(name.trim()) : "unknown");

  const getImagePath = (rowIndex, info) => {
    if (!info) return "";
    if (rowIndex === 0) return `/kingsraid-data/assets/perks/t1/${info.file}`;
    if (rowIndex === 1 && heroClass) return `/kingsraid-data/assets/perks/t2/${heroClass.toLowerCase()}/${info.file}`;
    if (rowIndex >= 2 && heroName) return `/kingsraid-data/assets/heroes/${encodeHeroName(heroName)}/perks/${info.file}`;
    return "";
  };

  const perkLayout = [
    { count: 5, cost: 10 },
    { count: 5, cost: 15 },
    { count: 4, cost: 15 },
    { count: 4, cost: 15 },
    { count: 2, cost: 15 },
  ];

  if (loading) return <div className="sp-panel"><div className="sp-loading">Loading perks...</div></div>;

  return (
    <div className="sp-panel">
      <div className={`perk-modal-points ${usedPoints > maxPoints ? "over-limit" : ""}`}>
        Points used: <span>{usedPoints}</span> / {maxPoints}
      </div>
      <div className="perk-modal-grid">
        {perkLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="perk-modal-row">
            {Array.from({ length: row.count }, (_, i) => {
              const globalIndex = rowIndex * 10 + i;
              const isOn = selectedIndices.includes(globalIndex);
              const isSkillRow = rowIndex >= 2;
              const sibling = globalIndex % 2 === 0 ? globalIndex + 1 : globalIndex - 1;
              const siblingIsOn = isSkillRow && selectedIndices.includes(sibling);
              // Blocked if: not selected, at limit, AND it's not a free light/dark swap
              const isBlocked = !isOn && usedPoints >= maxPoints && !siblingIsOn;
              const info = getPerkImageInfo(rowIndex, i, globalIndex);
              const imgPath = getImagePath(rowIndex, info);
              return (
                <div
                  key={globalIndex}
                  className={`perk-modal-option ${isOn ? "selected" : ""} ${isBlocked ? "perk-blocked" : ""}`}
                  onClick={() => togglePerk(globalIndex, row.cost)}
                  onMouseEnter={(e) => handleHover(info, rowIndex, e)}
                  onMouseLeave={hideOverlay}
                >
                  {info ? (
                    <>
                      <img src={imgPath} alt={info.name} className="perk-image" style={{ opacity: isOn ? 1 : 0.4 }} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                      <div className="perk-fallback">{info.name.substring(0, 6)}</div>
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
