import { useState, useEffect, useRef, useMemo } from "react";
import { useArtifacts } from "../../contexts/ArtifactContext";
import { useHeroContext } from "../../contexts/HeroContext";
import {
  getHeroIconUrl,
  getHeroUtUrl,
  getHeroSkillUrl
} from "../../utils/heroAssetResolver";

import "./AvatarSelectorModal.css";

const ITEMS_PER_LOAD = 35;

const AvatarSelectorModal = ({ data, onClose }) => {
  const { onSelect } = data;

  const { allArtifacts } = useArtifacts();
  const { allHeroes } = useHeroContext();

  const [activeTab, setActiveTab] = useState("hero");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [selectedKey, setSelectedKey] = useState(null);

  const gridRef = useRef(null);
  const loaderRef = useRef(null);

  // ===============================
  // Build Items
  // ===============================
  const allItems = useMemo(() => {
    if (!allHeroes) return [];

    if (activeTab === "hero") {
      return allHeroes.map(hero => ({
        type: "hero-ico",
        value: hero.slug,
        src: getHeroIconUrl(hero.slug),
      }));
    }

    if (activeTab === "ut") {
      return allHeroes.flatMap(hero =>
        [1, 2, 3, 4].map(index => ({
          type: "hero-ut",
          value: hero.slug,
          index,
          src: getHeroUtUrl(hero.slug, index),
        }))
      );
    }

if (activeTab === "skill") {
  return allHeroes.flatMap(hero => {
    const skills = [];

    for (let i = 1; i <= 4; i++) {
      skills.push({
        type: "hero-skill",
        value: hero.slug,
        index: i,
        variant: null, // resolved dynamically
        src: getHeroSkillUrl(hero.slug, i),
      });
    }

    return skills;
  });
}



    if (activeTab === "artifact") {
      return allArtifacts.map(artifact => ({
        type: "artifact",
        value: artifact.slug,
        src: `/kingsraid-data/assets/${artifact.thumbnail}`,
      }));
    }

    return [];
  }, [activeTab, allHeroes, allArtifacts]);

  // Reset on tab change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
    setSelectedKey(null);

    if (gridRef.current) {
      gridRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev =>
            Math.min(prev + ITEMS_PER_LOAD, allItems.length)
          );
        }
      },
      {
        root: gridRef.current,
        threshold: 0.1,
      }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [allItems.length]);

  const visibleItems = allItems.slice(0, visibleCount);

  return (
    <div className="avatar-modal-container">
      <h3 className="avatar-modal-title">Select Avatar</h3>

      <div className="avatar-tabs">
        <button
          className={activeTab === "hero" ? "active" : ""}
          onClick={() => setActiveTab("hero")}
        >
          Hero
        </button>

        <button
          className={activeTab === "ut" ? "active" : ""}
          onClick={() => setActiveTab("ut")}
        >
          UT
        </button>

        <button
          className={activeTab === "skill" ? "active" : ""}
          onClick={() => setActiveTab("skill")}
        >
          Skill
        </button>

        <button
          className={activeTab === "artifact" ? "active" : ""}
          onClick={() => setActiveTab("artifact")}
        >
          Artifact
        </button>
      </div>

      <div ref={gridRef} className="avatar-grid">
        {visibleItems.map((item, index) => {
          const key = `${item.type}-${item.value}-${item.index ?? ""}-${index}`;
          const isSelected = selectedKey === key;

          return (
            <div
              key={key}
              className={`avatar-option ${isSelected ? "selected" : ""}`}
              onClick={() => {
                setSelectedKey(key);
                onSelect(item);
                onClose();
              }}
            >
              <img
  src={item.src}
  loading="lazy"
  alt="Avatar"
  onError={(e) => {
    if (item.type !== "hero-skill") {
      e.target.style.display = "none";
      return;
    }

    const tried = e.target.dataset.tried || "0";

    if (tried === "0") {
      e.target.dataset.tried = "1";
      e.target.src = getHeroSkillUrl(item.value, item.index, 1);
    } else if (tried === "1") {
      e.target.dataset.tried = "2";
      e.target.src = getHeroSkillUrl(item.value, item.index, 2);
    } else {
      e.target.style.display = "none";
    }
  }}
/>

            </div>
          );
        })}

        {visibleCount < allItems.length && (
          <div ref={loaderRef} className="avatar-loader-trigger" />
        )}
      </div>
    </div>
  );
};

export default AvatarSelectorModal;
