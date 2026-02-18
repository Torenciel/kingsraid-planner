export const sortTeamByPosition = (teamHeroes, heroMetadataMap) => {
  if (!teamHeroes || !heroMetadataMap) return [];

  const zonePriority = {
    back: 0,
    middle: 1,
    front: 2,
  };
  // Create a copy that we will mutate 
  return [...teamHeroes]
    // Transforming hero config into sortable object with metadata
    .map((heroConfig, index) => {
      // Get the position with heroConfig = { heroSlug, slotPosition }
      const meta = heroMetadataMap[heroConfig.heroSlug];
      const positionString = meta?.infos?.position;

      console.log(
        "Sorting hero:",
        heroConfig.heroSlug,
        "=>",
        heroMetadataMap[heroConfig.heroSlug]?.infos?.position
      );

      // Fallback If no number → assume 250 / If no zone → treat as middle
      if (!positionString) {
        return {
          ...heroConfig,
          _zone: 1,
          _value: 250,
          _originalIndex: index,
        };
      }

      const raw = positionString.toLowerCase();

      let zone = "middle";
      let value = 250;

      // Extract zone from position string
      if (raw.includes("back")) zone = "back";
      if (raw.includes("middle")) zone = "middle";
      if (raw.includes("front")) zone = "front";

      // Extract the number in position
      const numberMatch = raw.match(/(\d+)/);
      // If there's a number, use it as value else use default (250)
      if (numberMatch) {
        value = parseInt(numberMatch[1], 10);
      }

      return {
        ...heroConfig,
        _zone: zonePriority[zone],
        _value: value,
        _originalIndex: index,
      };
    })
    // Sort by zone first, then by value, then by original index
    .sort((a, b) => {
      // Back before Middle before Front.
      if (a._zone !== b._zone) {
        return a._zone - b._zone;
      }
      // Hero with lower value to the left
      if (a._value !== b._value) {
        return a._value - b._value;
      }
      // if equal value, hero keep original order (select order)
      return a._originalIndex - b._originalIndex;
    });
};
