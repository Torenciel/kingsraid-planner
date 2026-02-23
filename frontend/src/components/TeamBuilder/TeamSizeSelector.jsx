// components/TeamSizeSelector/TeamSizeSelector.jsx
import { useTeam } from "../../contexts/TeamContext";
import "./TeamSizeSelector.css";

const TeamSizeSelector = () => {
  const { teamSize, changeTeamSize, team } = useTeam();

  const options = [4, 6, 8];

  const handleChange = (e) => {
    const newSize = parseInt(e.target.value);

    // Check if there is enough space for another hero
    const heroCount = team.filter((h) => h !== null).length;
    if (heroCount > newSize) {
      if (
        window.confirm(
          `You have ${heroCount} heroes in your team. Changing to ${newSize} slots will remove ${
            heroCount - newSize
          } hero(es). Continue?`
        )
      ) {
        changeTeamSize(newSize);
      } else {
        // Revert to current size
        e.target.value = teamSize;
      }
    } else {
      changeTeamSize(newSize);
    }
  };

  return (
    <div className="team-size-selector">
      <label htmlFor="team-size" className="team-size-label">
        Team Size:
      </label>
      <select
        id="team-size"
        value={teamSize}
        onChange={handleChange}
        className="team-size-select"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size} Heroes
          </option>
        ))}
      </select>
    </div>
  );
};

export default TeamSizeSelector;
