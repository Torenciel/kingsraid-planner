import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaBookmark, FaRegBookmark, FaArrowUp } from "react-icons/fa";
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
  onUpvote,
  onBookmark,
  onOpen,
}) {
  const navigate = useNavigate();
  
  const [upvotes, setUpvotes] = useState(team?.upvotes || 0);
  const [bookmarked, setBookmarked] = useState(false);

  const sortedHeroes = useMemo(() => {
    if (!team?.heroes || !heroMetadataMap) return [];
    return sortTeamByPosition(team.heroes, heroMetadataMap);
  }, [team, heroMetadataMap]);

  const handleUpvote = (e) => {
    e.stopPropagation();
    setUpvotes((prev) => prev + 1);
    onUpvote?.(team.id);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setBookmarked((prev) => !prev);
    onBookmark?.(team.id);
  };

  if (!team) return null;

  return (
    <div className="team-card clickable" onClick={() => navigate(`/team/${team.slug}`)}>
      <div className="team-left">
        <h3 className="team-name">{team.name}</h3>

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
        <button onClick={handleUpvote} className="icon-btn">
          <FaArrowUp />
          <span>{upvotes}</span>
        </button>

        <button onClick={handleBookmark} className="icon-btn">
          {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
        </button>

        <span className="bookmark-count">
          {team.bookmarks || 0}
        </span>

        <span className="created-by">
          by {team.createdBy || "Unknown"}
        </span>
      </div>
    </div>
  );
}
