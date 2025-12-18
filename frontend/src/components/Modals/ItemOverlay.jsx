import "./ItemOverlay.css";

// Fonction pour UW/UT (structure différente)
const formatUWUTDescription = (description, values, starLevel) => {
  if (!values) return [{ type: "text", content: description }];

  let parts = [];
  let currentText = description;

  Object.keys(values).forEach((key) => {
    const valueObj = values[key];
    const selectedValue = valueObj[starLevel.toString()] || valueObj["0"];

    const partsArray = currentText.split(`(${key})`);
    if (partsArray.length > 1) {
      if (partsArray[0]) {
        parts.push({ type: "text", content: partsArray[0] });
      }
      parts.push({ type: "value", content: selectedValue });
      currentText = partsArray.slice(1).join(`(${key})`);
    }
  });

  if (currentText) {
    parts.push({ type: "text", content: currentText });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: description }];
};

// Fonction pour Artifacts (structure avec split - VOTRE FORMAT)
const formatArtifactDescription = (description, values, starLevel) => {
  if (!values) return [{ type: "text", content: description }];

  let parts = [];
  let currentText = description;

  Object.keys(values).forEach((key) => {
    const valueStr = values[key];
    const valueArray = valueStr.split(", ");
    const selectedValue =
      valueArray[Math.min(starLevel, valueArray.length - 1)] || valueArray[0];

    const partsArray = currentText.split(`(${key})`);
    if (partsArray.length > 1) {
      if (partsArray[0]) {
        parts.push({ type: "text", content: partsArray[0] });
      }
      parts.push({ type: "value", content: selectedValue });
      currentText = partsArray.slice(1).join(`(${key})`);
    }
  });

  if (currentText) {
    parts.push({ type: "text", content: currentText });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: description }];
};

// Fonction principale qui choisit le bon formatage
const formatDescription = (description, values, starLevel, itemType) => {
  if (!values) return [{ type: "text", content: description }];

  if (itemType === "uw" || itemType === "ut") {
    return formatUWUTDescription(description, values, starLevel);
  } else {
    return formatArtifactDescription(description, values, starLevel);
  }
};

const ItemOverlay = ({
  title,
  stars,
  description,
  values,
  itemType,
  className = "",
}) => {
  const formattedDescription = formatDescription(
    description,
    values,
    stars,
    itemType
  );

  return (
    <div className={`item-overlay-content ${className}`}>
      {/* En-tête */}
      <div className="item-overlay-header">
        <div className="item-overlay-stars">{stars}★</div>
        <div className="item-overlay-title">{title}</div>
      </div>

      {/* Description formatée */}
      <div className="item-overlay-description">
        {formattedDescription.map((part, index) =>
          part.type === "value" ? (
            <span key={index} className="item-overlay-value">
              {part.content}
            </span>
          ) : (
            <span key={index}>{part.content}</span>
          )
        )}
      </div>
    </div>
  );
};

export default ItemOverlay;
