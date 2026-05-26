import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaArrowUp, FaBookmark, FaRegBookmark } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import TeamSlots from "../components/TeamSlots/TeamSlots";
import { useAuth } from "../contexts/AuthContext";
import { useTeam } from "../contexts/TeamContext";
import { TAG_MAP } from "../constants/tagGroups";
import { useToggleBookmark, useToggleUpvote } from "../hooks/useApi";
import "./TeamViewer.css";

const TeamViewer = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { convertDBToTeamContext } = useTeam();
  const { user, refetchAuth } = useAuth();

  const [teamData, setTeamData] = useState(null);
  const [rawTeam, setRawTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvotes, setUpvotes] = useState(0);
  const [bookmarks, setBookmarks] = useState(0);
  const [upvoted, setUpvoted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const { toggleUpvote } = useToggleUpvote();
  const { toggleBookmark } = useToggleBookmark();

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await fetch(`http://localhost:3002/api/v2/teams/${slug}`);
        const result = await response.json();
        if (result.success) {
          setRawTeam(result.team);
          setTeamData(convertDBToTeamContext(result.team));
          setUpvotes(result.team.upvotes ?? 0);
          setBookmarks(result.team.bookmarks ?? 0);
        }
      } catch (error) {
        console.error("Error loading team:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, [slug, convertDBToTeamContext]);

  const teamId = rawTeam?.id || rawTeam?._id;

  const isOwner = useMemo(() =>
    user?.id && rawTeam?.author && String(rawTeam.author) === String(user.id),
    [user, rawTeam]
  );

  useEffect(() => {
    if (!user || !teamId) return;
    setUpvoted(user.upvotedTeams?.map(String).includes(String(teamId)) ?? false);
    setBookmarked(
      user.bookmarkedTeams?.some((b) => String(b.teamId || b) === String(teamId)) ?? false
    );
  }, [user, teamId]);

  const handleUpvote = async () => {
    if (!user || isOwner) return;
    try {
      const data = await toggleUpvote(teamId);
      setUpvoted(data.upvoted);
      setUpvotes(data.upvotes);
    } catch {
      // silent fail
    }
  };

  const handleBookmark = async () => {
    if (!user || isOwner) return;
    try {
      const data = await toggleBookmark(teamId);
      setBookmarked(data.bookmarked);
      setBookmarks(data.bookmarks);
      refetchAuth();
    } catch {
      // silent fail
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!teamData) return <div>Team not found</div>;

  return (
    <div className="team-viewer">
      <button className="tv-back-btn" onClick={() => navigate("/teams/public")}>
        <FaArrowLeft /> Back
      </button>
      <header className="tv-header">
        <div className="tv-title-container">
          <h2 className="tv-title">{teamData.name}</h2>
          <span className="tv-author">by {rawTeam?.createdBy || teamData.createdBy}</span>
        </div>
        <div className="tv-stats">
          <button
            className={`tv-stat-btn${upvoted ? " upvoted" : ""}`}
            onClick={handleUpvote}
            disabled={isOwner || !user}
            title={isOwner ? "Can't upvote your own team" : user ? (upvoted ? "Remove upvote" : "Upvote") : "Login to upvote"}
          >
            <FaArrowUp /> {upvotes}
          </button>
          <button
            className={`tv-stat-btn${bookmarked ? " bookmarked" : ""}`}
            onClick={handleBookmark}
            disabled={isOwner || !user}
            title={isOwner ? "Can't bookmark your own team" : user ? (bookmarked ? "Remove bookmark" : "Bookmark") : "Login to bookmark"}
          >
            {bookmarked ? <FaBookmark /> : <FaRegBookmark />} {bookmarks}
          </button>
        </div>
      </header>

      <TeamSlots
        readOnly={true}
        teamOverride={teamData.team}
        subSlotsOverride={teamData.subSlots}
        subStarsOverride={teamData.subStars}
        advancementsOverride={teamData.advancements}
        perksOverride={teamData.perks}
      />

      {teamData.tags?.length > 0 && (
        <div className="tv-tags">
          {teamData.tags.map((tagId) => (
            <span key={tagId} className="filter-tag tv-tag">
              {TAG_MAP[tagId] || tagId}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamViewer;
