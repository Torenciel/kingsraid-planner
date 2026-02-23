import { useState } from "react";
import "./StarRating.css"; // <-- IMPORT

const StarRating = ({
  value = 0,
  onChange,
  maxStars = 5,
  showZeroOption = true,
  size = "medium", // 'small', 'medium', 'large'
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const handleStarClick = (starValue) => {
    if (onChange) {
      onChange(starValue);
    }
  };

  const handleStarHover = (starValue) => {
    setHoverValue(starValue);
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  return (
    <div className={`star-rating-container ${size}`}>
      {/* 0 Stars (×) */}
      {showZeroOption && (
        <span
          className="star-rating-zero"
          onClick={() => handleStarClick(0)}
          onMouseEnter={() => handleStarHover(0)}
          onMouseLeave={handleMouseLeave}
        >
          ×
        </span>
      )}

      {/* 1-5 Stars */}
      {Array.from({ length: maxStars }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= value;
        const isHovered = hoverValue > 0 && starValue <= hoverValue;
        const willBeDeselected =
          hoverValue > 0 && starValue > hoverValue && starValue <= value;

        let starClass = "star-rating-star";
        if (isFilled) {
          starClass += " filled";
        }
        if (isHovered && !isFilled) {
          starClass += " hover-preview";
        }
        if (willBeDeselected) {
          starClass += " will-deselect";
        }

        return (
          <span
            key={starValue}
            className={starClass}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            onMouseLeave={handleMouseLeave}
          >
            {isFilled ? "★" : "☆"}
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
