import { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import Toggle from "../components/UI/Toggle";

import "./Profile.css";

import { FaDiscord, FaYoutube, FaTwitch } from "react-icons/fa";

const Profile = () => {
  const { user, refetchAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Format the date where the user registered
  const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(
        "http://localhost:3002/api/v2/users/me/avatar",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Upload failed");
        return;
      }

      await refetchAuth();
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Toggle checkbox preferences
  const [preferences, setPreferences] = useState({
  profilePrivate: false,
  teamsPrivateByDefault: false,
  lightMode: false,
});

  const togglePreference = (key) => {
  setPreferences((prev) => ({
    ...prev,
    [key]: !prev[key],
  }));
  };

  const updatePreference = async (key, value) => {
  await fetch("http://localhost:3002/api/v2/users/me/preferences", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      [key]: value,
    }),
  });

  await refetchAuth();
};

  const toggleTheme = async () => {
  const newTheme =
    user.preferences.theme === "dark" ? "light" : "dark";

  await fetch("http://localhost:3002/api/v2/users/me/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ theme: newTheme }),
  });

  await refetchAuth(); // THIS is what updates the UI + theme
};


  return (
      <div className="profile-container">
         {/* <div className="profile-banner" style={{ backgroundImage: "url(/kingsraid-data/assets/heroes/Loman/sa.png)" }}/> */}
         <div className="profile-banner" style={{ backgroundImage: "url(/city.png)" }}/>
      <div className="profile-wrapper">        
      <div className="profile-avatar-container">
        <div
          className="profile-avatar-hover-wrapper"
          onClick={() => fileInputRef.current?.click()}
        >
          <img
            src={
              user.profilePicture === "default-avatar.png"
                ? "/default-avatar.png"
                : `http://localhost:3002/${user.profilePicture}?v=${user.avatarVersion}`
            }
            alt="Avatar"
            className="profile-avatar"
          />

          <div className="profile-avatar-overlay">
            Upload avatar
          </div>
        </div>

            <div className="profile-user-info">
              <label className="profile-display-name">{user.displayName}</label>
              {/* <label className="profile-display-role">{user.role}</label> */}
              {/* <label className="profile-display-Registered-date"> Registered since {formatDate(user.createdAt)}</label> */}
            </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          disabled={loading}
          className="profile-upload-input-hidden"
        />

        {loading && <p className="profile-loading">Uploading...</p>}
        {error && <p className="profile-error">{error}</p>}
        </div>
        
        </div>
        
      <div className="profile-middle-bar">
        <div className="profile-stats-section">
          <p className="profil-stats-teams">12<br /><span>Teams</span></p>
          <p className="profil-stats-upvoted">4<br /><span>Upvoted</span></p>
          <p className="profil-stats-bookmarked">3<br /><span>Bookmarked</span></p>
        </div>

        <div className="profile-middle-spacer" />

        <div className="profile-socials-container">
          <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" className="profile-social-link discord-link">
            <FaDiscord size={24} />
          </a>
          <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="profile-social-link youtube-link">
            <FaYoutube size={24} />
          </a>
          <a href="https://www.twitch.tv/" target="_blank" rel="noopener noreferrer" className="profile-social-link twitch-link">
            <FaTwitch size={24} />
          </a>
        </div>
      </div>

      <div className="profile-settings-container">

        <div className="profile-preferences-container">
          <div className="profile-preferences-section">
          <label className="profile-preferences-title">Preferences</label>
          <Toggle
            label="Set profile to private"
            checked={user.preferences.profileVisibility === "private"}
            onChange={() =>
              updatePreference(
                "profileVisibility",
                user.preferences.profileVisibility === "private"
                  ? "public"
                  : "private"
              )
            }
          />


          <Toggle
            label="Set teams to private by default"
            checked={user.preferences.defaultTeamVisibility === "private"}
            onChange={() =>
              updatePreference(
                "defaultTeamVisibility",
                user.preferences.defaultTeamVisibility === "private"
                  ? "public"
                  : "private"
              )
            }
          />


          <Toggle
            label="Light mode"
            checked={user.preferences.theme === "light"}
            onChange={() =>
              updatePreference(
                "theme",
                user.preferences.theme === "light" ? "dark" : "light"
              )
            }
          />


        </div>
        </div>
        <div className="profile-edit-container">
          <div className="profile-edit-section">
            <Link to="/account/username" className="button">
              Change username
            </Link>

            <Link to="/account/password" className="button">
              Change password
            </Link>

            <Link to="/account/email" className="button">
              Change email
            </Link>
          </div>
        </div>

      </div>
      </div>
  );
};

export default Profile;
