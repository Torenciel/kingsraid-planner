export const sortTeamByPosition = (teamHeroes, heroMetadataMap) => {
  if (!teamHeroes || !heroMetadataMap) return [];

  const zonePriority = {
    back: 0,
    middle: 1,
    front: 2,
  };

  return [...teamHeroes]
    .map((heroConfig, index) => {
      const meta = heroMetadataMap[heroConfig.heroSlug];
      const positionString = meta?.infos?.position;

      console.log(
  "Sorting hero:",
  heroConfig.heroSlug,
  "=>",
  heroMetadataMap[heroConfig.heroSlug]?.infos?.position
);

      
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

      if (raw.includes("back")) zone = "back";
      if (raw.includes("middle")) zone = "middle";
      if (raw.includes("front")) zone = "front";

      const numberMatch = raw.match(/(\d+)/);
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
    .sort((a, b) => {
      if (a._zone !== b._zone) {
        return a._zone - b._zone;
      }

      if (a._value !== b._value) {
        return a._value - b._value;
      }

      return a._originalIndex - b._originalIndex;
    });
};
