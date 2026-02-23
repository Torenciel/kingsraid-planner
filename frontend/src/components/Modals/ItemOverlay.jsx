import "./ItemOverlay.css";

const ItemOverlay = ({
  title,
  stars = 0,
  description = "",
  values = {},
  className = "",
}) => {

  const getFormattedValue = (key, starLevel) => {
    if (!values?.[key]) return "";

    const valueData = values[key];

    // Format 1: comma-separated string (artifacts)
    if (typeof valueData === "string") {
      const valueArray = valueData.split(/,\s*/);
      const index = Math.min(starLevel, valueArray.length - 1);
      return valueArray[index] || valueArray[0] || "";
    }

    // Format 2: object with star keys (UW/UT)
    if (typeof valueData === "object") {
      return valueData[starLevel] ?? valueData["0"] ?? "";
    }

    return "";
  };

  const formatDescription = () => {
    if (!description) {
      return [{ type: "text", content: "" }];
    }

    if (!values || Object.keys(values).length === 0) {
      return [{ type: "text", content: description }];
    }

    let remainingText = description;
    const parts = [];

    const sortedKeys = Object.keys(values)
      .filter(key => !isNaN(parseInt(key)))
      .sort((a, b) => Number(a) - Number(b));

    for (const key of sortedKeys) {
      const selectedValue = getFormattedValue(key, stars);
      if (!selectedValue) continue;

      const placeholderRegex = new RegExp(`\\(${key}\\)`, "g");

      if (!placeholderRegex.test(remainingText)) continue;

      const splitText = remainingText.split(placeholderRegex);

      if (splitText[0]) {
        parts.push({ type: "text", content: splitText[0] });
      }

      parts.push({ type: "value", content: selectedValue });

      remainingText = splitText.slice(1).join("");
    }

    if (remainingText) {
      parts.push({ type: "text", content: remainingText });
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
