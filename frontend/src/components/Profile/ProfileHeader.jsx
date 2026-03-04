import { FaDiscord, FaYoutube, FaTwitch, FaPen } from "react-icons/fa";
import "./ProfileHeader.css";

import { getHeroSplashUrl } from "../../utils/heroAssetResolver";
import { resolveAvatarUrl } from "../../utils/avatarResolver";
import { useHeroContext } from "../../contexts/HeroContext";
import { useArtifacts } from "../../contexts/ArtifactContext";
import { useModal } from "../../contexts/ModalContext";
import { getHeroSkillUrl } from "../../utils/heroAssetResolver";
import SmartAvatarImage from "../UI/SmartAvatarImage";



const ProfileHeader = ({
  user,
  editable = false,
  refetchAuth,
  teams = 0,
  upvoted = 0,
  bookmarked = 0,
}) => {
  const { allHeroes } = useHeroContext();
  const { allArtifacts } = useArtifacts();
  const { openModal } = useModal();

  // ==============================
  // Resolve Avatar
  // ==============================
  const avatarUrl = resolveAvatarUrl(user.avatar, allArtifacts);

  // ==============================
  // Resolve Banner
  // ==============================
  const bannerUrl =
    user.banner?.type === "hero"
      ? getHeroSplashUrl(user.banner.value)
      : "/kings-raid-pandemonium-desaturated.jpg";

  // ==============================
  // Handle Avatar Selection
  // ==============================
  const handleAvatarSelect = async (selection) => {
    await fetch("http://localhost:3002/api/v2/users/me/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(selection),
    });

    await refetchAuth();
  };

  // ==============================
  // Handle Banner Selection
  // ==============================
  const handleBannerSelect = async (selection) => {
    await fetch("http://localhost:3002/api/v2/users/me/banner", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(selection),
    });

    await refetchAuth();
  };

  return (
    <>
      {/* ==============================
          BANNER
      ============================== */}
      <div
        className="profile-banner"
        style={{ backgroundImage: `url(${bannerUrl})` }}
        onClick={() =>
          editable &&
          openModal("banner", {
            onSelect: handleBannerSelect,
          })
        }
      >
        {editable && (
          <div className="profile-banner-overlay">
            Change banner
          </div>
        )}
      </div>

      {/* ==============================
          AVATAR + USER INFO
      ============================== */}
      <div className="profile-header-center">
        <div
          className="profile-avatar-wrapper"
          onClick={() =>
            editable &&
            openModal("avatar", {
              onSelect: handleAvatarSelect,
            })
          }
        >
          <SmartAvatarImage
            avatar={user.avatar}
            src={avatarUrl}
            className="profile-avatar"
          />


          {editable && (
            <div className="profile-avatar-overlay icon">
              <FaPen />
            </div>
          )}
        </div>

        <div className="profile-user-info">
          <span className="profile-display-name">
            {user.displayName}
          </span>
        </div>
      </div>

      {/* ==============================
          STATS + SOCIALS
      ============================== */}
      <div className="profile-middle-bar">
        <div className="profile-stats-section">
          <p>
            {teams}
            <br />
            <span>Teams</span>
          </p>

          <p className="profil-stats-upvoted">
            {upvoted}
            <br />
            <span>Upvoted</span>
          </p>

          <p>
            {bookmarked}
            <br />
            <span>Bookmarked</span>
          </p>
        </div>

        <div />

        <div className="profile-socials-container">
          <a href="#" className="profile-social-link discord-link">
            <FaDiscord size={24} />
          </a>
          <a href="#" className="profile-social-link youtube-link">
            <FaYoutube size={24} />
          </a>
          <a href="#" className="profile-social-link twitch-link">
            <FaTwitch size={24} />
          </a>
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;
