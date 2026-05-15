import { useMemo, useState } from "react";
import { FaArrowUp, FaBookmark, FaRegBookmark } from "react-icons/fa";
import { MdLockOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToggleBookmark, useToggleUpvote } from "../../hooks/useApi";
import { sortTeamByPosition } from "../../utils/sortTeamByPosition";
import "./TeamCard.css";

const getHeroImagePath = (slug) => {
  if (!slug) return "";

  const folderName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return `/kingsraid-data/assets/heroes/${folderName}/ico.png`;
};

export default function TeamCard({
  team,
  heroMetadataMap,
  currentUserId,
  isBookmarked: initialBookmarked = false,
  isUpvoted: initialUpvoted = false,
  onBookmarkToggle,
}) {
  const navigate = useNavigate();
  const isOwner = currentUserId && team?.author && String(team.author) === String(currentUserId);

  const [upvotes, setUpvotes] = useState(team?.upvotes || 0);
  const [bookmarks, setBookmarks] = useState(team?.bookmarks || 0);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [upvoted, setUpvoted] = useState(initialUpvoted);

  const { refetchAuth } = useAuth();
  const { toggleBookmark } = useToggleBookmark();
  const { toggleUpvote } = useToggleUpvote();

  const sortedHeroes = useMemo(() => {
    if (!team?.heroes || !heroMetadataMap) return [];
    return sortTeamByPosition(team.heroes, heroMetadataMap);
  }, [team, heroMetadataMap]);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (!currentUserId) return;
    try {
      const data = await toggleUpvote(team.id);
      setUpvoted(data.upvoted);
      setUpvotes(data.upvotes);
    } catch {
      // silent fail
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!currentUserId) return;
    try {
      const data = await toggleBookmark(team.id);
      setBookmarked(data.bookmarked);
      setBookmarks(data.bookmarks);
      refetchAuth();
      onBookmarkToggle?.(team.id, data.bookmarked);
    } catch {
      // silent fail
    }
  };

  if (!team) return null;

  return (
    <div
      className="team-card clickable"
      onClick={() => navigate(isOwner ? `/team/edit/${team.slug}` : `/team/${team.slug}`)}
    >
      <div className="team-left">
        <div className="team-name-block">
          <h3 className="team-name">{team.name}</h3>
          <span className="created-by">by {team.createdBy || "Unknown"}</span>
        </div>

        <div className="team-heroes">
          {sortedHeroes.map((hero) => (
            <div key={hero.heroSlug} className="hero-wrapper">
              <img
                src={getHeroImagePath(hero.heroSlug)}
                alt={hero.heroSlug}
                className="hero-image"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="team-footer">
        {!team.isPublic && (
          <MdLockOutline className="lock-icon" title="Private team" />
        )}

        <button
          onClick={handleUpvote}
          className={`icon-btn${upvoted ? " upvoted" : ""}`}
          disabled={isOwner}
          title={isOwner ? "Can't upvote your own team" : currentUserId ? (upvoted ? "Remove upvote" : "Upvote") : "Login to upvote"}
        >
          <FaArrowUp />
          <span>{upvotes}</span>
        </button>

        <button
          onClick={handleBookmark}
          className={`icon-btn${bookmarked ? " bookmarked" : ""}`}
          disabled={isOwner}
          title={isOwner ? "Can't bookmark your own team" : currentUserId ? (bookmarked ? "Remove bookmark" : "Bookmark") : "Login to bookmark"}
        >
          {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
          <span>{bookmarks}</span>
        </button>
      </div>
    </div>
  );
}
