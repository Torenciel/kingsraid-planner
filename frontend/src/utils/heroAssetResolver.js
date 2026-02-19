// utils/heroAssetResolver.js

/**
 * Convert hero slug to public folder name.
 * Example:
 *   "fallen-frey" → "Fallen Frey"
 */
export const getHeroFolderFromSlug = (slug) => {
  if (!slug) return "";

  const folderName = slug
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");

  // Encode spaces and special characters safely
  return encodeURIComponent(folderName);
};

/**
 * Hero icon (ico.png)
 */
export const getHeroIconUrl = (slug) => {
  const folder = getHeroFolderFromSlug(slug);
  return `/kingsraid-data/assets/heroes/${folder}/ico.png`;
};

/**
 * Hero splash art (sa.png)
 */
export const getHeroSplashUrl = (slug) => {
  const folder = getHeroFolderFromSlug(slug);
  return `/kingsraid-data/assets/heroes/${folder}/sa.png`;
};

/**
 * Hero soul weapon (sw.png)
 */
export const getHeroSwUrl = (slug) => {
  const folder = getHeroFolderFromSlug(slug);
  return `/kingsraid-data/assets/heroes/${folder}/sw.png`;
};

/**
 * Hero unique treasure (ut/1-4.png)
 */
export const getHeroUtUrl = (slug, index = 1) => {
  const folder = getHeroFolderFromSlug(slug);
  return `/kingsraid-data/assets/heroes/${folder}/ut/${index}.png`;
};

/**
 * Hero skill icons (skills/1-4.png)
 */
export const getHeroSkillUrl = (slug, index = 1, variant = null) => {
  const folder = getHeroFolderFromSlug(slug);

  if (variant) {
    return `/kingsraid-data/assets/heroes/${folder}/skills/${index} (${variant}).png`;
  }

  return `/kingsraid-data/assets/heroes/${folder}/skills/${index}.png`;
};



