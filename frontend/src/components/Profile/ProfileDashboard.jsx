import { Link } from "react-router-dom";
import Toggle from "../UI/Toggle";
import "./ProfileDashboard.css";

const ProfileDashboard = ({ user, updatePreference }) => {
  return (
    <div className="profile-settings-container">

      <div className="profile-preferences-section">
        <label className="profile-preferences-title">
          Preferences
        </label>

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
              user.preferences.theme === "light"
                ? "dark"
                : "light"
            )
          }
        />
      </div>

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
  );
};

export default ProfileDashboard;
