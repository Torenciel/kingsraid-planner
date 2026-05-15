import { useModal } from "../../contexts/ModalContext";
import { useTeam } from "../../contexts/TeamContext";
import "./SaveTeamButton.css";

const SaveTeamButton = () => {
  const { team } = useTeam();
  const { openModal } = useModal();

  const hasHeroes = team.some((h) => h !== null);

  return (
    <div className="save-team-container">
      <div className="save-team-buttons">
        <button
          onClick={() => openModal("team-settings", { isSaveMode: true })}
          disabled={!hasHeroes}
          className={`save-button-main ${!hasHeroes ? "disabled" : ""}`}
        >
          Save Team
        </button>
      </div>
    </div>
  );
};

export default SaveTeamButton;
