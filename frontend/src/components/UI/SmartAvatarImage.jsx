import { getHeroSkillUrl } from "../../utils/heroAssetResolver";

const SmartAvatarImage = ({ avatar, src, className }) => {
  return (
    <img
      src={src}
      className={className}
      alt="Avatar"
      onError={(e) => {
        if (!avatar || avatar.type !== "hero-skill") {
          e.target.src = "/default-avatar.png";
          return;
        }

        const tried = e.target.dataset.tried || "0";

        if (tried === "0") {
          e.target.dataset.tried = "1";
          e.target.src = getHeroSkillUrl(
            avatar.value,
            avatar.index,
            1
          );
        } else if (tried === "1") {
          e.target.dataset.tried = "2";
          e.target.src = getHeroSkillUrl(
            avatar.value,
            avatar.index,
            2
          );
        } else {
          e.target.src = "/default-avatar.png";
        }
      }}
    />
  );
};

export default SmartAvatarImage;
