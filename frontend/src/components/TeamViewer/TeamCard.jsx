import { useState } from "react";
import { FaBookmark, FaRegBookmark, FaArrowUp } from "react-icons/fa";

const getHeroImage = (slug) => `/assets/heroes/${slug}.webp`;

export default function TeamCard({ team, onUpvote, onBookmark }) {
  const [upvotes, setUpvotes] = useState(team.upvotes);
  const [bookmarked, setBookmarked] = useState(false); // later connect to user

  const handleUpvote = (e) => {
    e.stopPropagation();
    setUpvotes((prev) => prev + 1); // optimistic UI
    onUpvote?.(team._id);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
    onBookmark?.(team._id);
  };

  return (
    <div className="team-card">
      {/* TEAM NAME */}
      <h3 className="team-name">{team.name}</h3>

      {/* HERO IMAGES */}
      <div className="team-heroes">
        {team.heroes
          .sort((a, b) => a.slotPosition - b.slotPosition)
          .map((hero) => (
            <img
              key={hero._id}
              src={getHeroImage(hero.heroSlug)}
              alt={hero.heroSlug}
              className="hero-avatar"
            />
          ))}
      </div>

      {/* TAGS */}
      {team.tags.length > 0 && (
        <div className="team-tags">
          {team.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* FOOTER */}
      <div className="team-footer">
        <div className="left">
          <button onClick={handleUpvote} className="icon-btn">
            <FaArrowUp />
            <span>{upvotes}</span>
          </button>
        </div>

        <div className="right">
          <button onClick={handleBookmark} className="icon-btn">
            {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
          </button>

          <span className="bookmark-count">
            {team.bookmarks}
          </span>

          <span className="created-by">
            by {team.createdBy}
          </span>
        </div>
      </div>
    </div>
  );
}
