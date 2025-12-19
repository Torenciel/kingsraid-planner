import "./ItemOverlay.css";

const ItemOverlay = ({
  title,
  stars = 0,
  description = "",
  values = {},
  itemType = "artifact",
  className = "",
}) => {
  // Fonction pour extraire la valeur selon le format
  const getFormattedValue = (key, starLevel) => {
    if (!values || !values[key]) return "";
    
    const valueData = values[key];
    
    // Format 1: String avec valeurs séparées par des virgules (artifacts)
    if (typeof valueData === 'string') {
      const valueArray = valueData.split(/,\s*/);
      const index = Math.min(starLevel, valueArray.length - 1);
      return valueArray[index] || valueArray[0] || "";
    }
    
    // Format 2: Objet avec clés 0-5 (UW/UT)
    if (typeof valueData === 'object' && valueData !== null) {
      const starKey = starLevel.toString();
      return valueData[starKey] || valueData["0"] || "";
    }
    
    return "";
  };

  const formatDescription = () => {
    if (!description) {
      return [{ type: "text", content: "" }];
    }

    if (!values || typeof values !== 'object' || Object.keys(values).length === 0) {
      return [{ type: "text", content: description }];
    }

    let currentText = description;
    const parts = [];

    const sortedKeys = Object.keys(values)
      .filter(key => !isNaN(parseInt(key)))
      .sort((a, b) => parseInt(a) - parseInt(b));

    for (const key of sortedKeys) {
      const selectedValue = getFormattedValue(key, stars);

      if (!selectedValue) continue;

      const placeholder = `(${key})`;
      const placeholderRegex = new RegExp(`\\(${key}\\)`, 'g');
      
      if (currentText.includes(placeholder)) {
        const textParts = currentText.split(placeholderRegex);
        
        if (textParts[0]) {
          parts.push({ type: "text", content: textParts[0] });
        }
        
        parts.push({ type: "value", content: selectedValue });
        currentText = textParts.slice(1).join('');
      }
    }

    if (currentText) {
      parts.push({ type: "text", content: currentText });
    }

    if (parts.length === 0) {
      parts.push({ type: "text", content: description });
    }

    return parts;
  };

  const formattedDescription = formatDescription();

  return (
    <div className={`item-overlay-content ${className}`}>
      <div className="item-overlay-header">
        <div className="item-overlay-stars">{stars}★</div>
        <div className="item-overlay-title">{title}</div>
      </div>

      <div className="item-overlay-description">
        {formattedDescription.map((part, index) => {
          if (part.type === "value") {
            return (
              <span key={index} className="item-overlay-value">
                {part.content}
              </span>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </div>
    </div>
  );
};

export default ItemOverlay;