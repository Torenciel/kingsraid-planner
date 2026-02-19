import { useState, useEffect, useRef, useMemo } from "react";
import { useHeroContext } from "../../contexts/HeroContext";
import { getHeroSplashUrl } from "../../utils/heroAssetResolver";
import "./BannerSelectorModal.css";

const ITEMS_PER_LOAD = 16;

const BannerSelectorModal = ({ data, onClose }) => {
  const { allHeroes } = useHeroContext();
  const onSelect = data?.onSelect;

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const gridRef = useRef(null);
  const loaderRef = useRef(null);

  // ===============================
  // Build Banner List
  // ===============================
  const allBanners = useMemo(() => {
    if (!allHeroes) return [];

    const heroBanners = allHeroes.map((hero) => ({
      type: "hero",
      value: hero.slug,
      src: getHeroSplashUrl(hero.slug),
    }));

    return [
      {
        type: "default",
        value: null,
        src: "/default-banner.png",
      },
      ...heroBanners,
    ];
  }, [allHeroes]);

  // Reset on open
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);

    if (gridRef.current) {
      gridRef.current.scrollTop = 0;
    }
  }, []);

  // Infinite scroll (inside modal scroll container)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + ITEMS_PER_LOAD, allBanners.length)
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
  }, [allBanners.length]);

  const visibleItems = allBanners.slice(0, visibleCount);

  return (
    <div className="banner-modal-container">
      <h3 className="banner-modal-title">Select Banner</h3>

      <div ref={gridRef} className="banner-grid">
        {visibleItems.map((item, index) => (
          <div
            key={`${item.type}-${item.value ?? "default"}-${index}`}
            className="banner-item"
            onClick={() => {
              if (onSelect) {
                onSelect({
                  type: item.type,
                  value: item.value,
                });
              }
              onClose();
            }}
          >
            <img
              src={item.src}
              loading="lazy"
              alt="Banner"
            />
          </div>
        ))}

        {visibleCount < allBanners.length && (
          <div ref={loaderRef} className="banner-loader-trigger" />
        )}
      </div>
    </div>
  );
};

export default BannerSelectorModal;
