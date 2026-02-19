import {
  getHeroIconUrl,
  getHeroSwUrl,
  getHeroUtUrl,
  getHeroSkillUrl
} from "./heroAssetResolver";


export const resolveAvatarUrl = (avatar, allArtifacts = []) => {
  if (!avatar || avatar.type === "default") {
    return "/default-avatar.png";
  }

  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  switch (avatar.type) {
    case "hero-ico":
      return getHeroIconUrl(avatar.value);

    case "hero-sw":
      return getHeroSwUrl(avatar.value);

case "hero-ut":
  return getHeroUtUrl(
    avatar.value,
    avatar.index || 1
  );

case "hero-skill":
  return getHeroSkillUrl(
    avatar.value,
    avatar.index,
    avatar.variant ?? null
  );


case "artifact": {
  const artifact = allArtifacts.find(
    (a) => a.slug === avatar.value
  );

  if (!artifact || !artifact.thumbnail) {
    return "/default-avatar.png";
  }

  // Artifact thumbnails are stored relative to kingsraid-data/assets
  return `/kingsraid-data/assets/${artifact.thumbnail}`;
}


    default:
      return "/default-avatar.png";
  }
};
