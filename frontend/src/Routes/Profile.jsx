import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileDashboard from "../components/Profile/ProfileDashboard";
import "./Profile.css"; // keep layout container styling here

const Profile = () => {
  const { user, refetchAuth } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const updatePreference = async (key, value) => {
    await fetch("http://localhost:3002/api/v2/users/me/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ [key]: value }),
    });

    await refetchAuth();
  };

  return (
    <div className="profile-container">
      <ProfileHeader
        user={user}
        editable={true}
        refetchAuth={refetchAuth}
        teams={12}        // later replace with real data
        upvoted={4}
        bookmarked={3}
      />

      <ProfileDashboard
        user={user}
        updatePreference={updatePreference}
      />
    </div>
  );
};

export default Profile;
