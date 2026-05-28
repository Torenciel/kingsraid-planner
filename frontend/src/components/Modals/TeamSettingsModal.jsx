import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeam } from "../../contexts/TeamContext";
import { TAG_GROUPS } from "../../constants/tagGroups";
import "./TeamSettingsModal.css";

const TeamSettingsModal = ({ data, onClose }) => {
  const {
    teamName,
    setTeamName,
    isPublic,
    setIsPublic,
    tags,
    setTags,
    changeTeamSize,
    teamSize,
    saveTeam,
  } = useTeam();

  const navigate = useNavigate();
  const { isNewTeam, isSaveMode } = data || {};

  const [localName, setLocalName] = useState(teamName || "New Team");
  const [localPublic, setLocalPublic] = useState(isPublic ?? true);
  const [localSize, setLocalSize] = useState(teamSize);
  const [localTags, setLocalTags] = useState(tags || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const toggleTag = (id) => {
    setLocalTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const applySettings = () => {
    setTeamName(localName.trim());
    setIsPublic(localPublic);
    setTags(localTags);
    if (localSize !== teamSize) changeTeamSize(localSize);
  };

  const handleConfirm = () => {
    if (!localName.trim()) return;
    applySettings();
    onClose();
  };

  const handleSave = async () => {
    if (!localName.trim()) return;
    applySettings();

    setIsSaving(true);
    setSaveMessage("Saving...");

    const result = await saveTeam(localName.trim(), {
      tags: localTags,
      isPublic: localPublic,
    });

    setIsSaving(false);
    if (result.success) {
      setSaveMessage("Team saved!");
      setTimeout(() => onClose(), 1200);
    } else {
      setSaveMessage(`Error: ${result.error || "Save failed"}`);
    }
  };

  const canSave = localName.trim().length > 0 && !isSaving;

  return (
    <div className="team-settings-modal">
      <h3 className="modal-title">Team Settings</h3>

      {/* Team Name */}
      <div className="tsm-field">
        <label className="tsm-label">Team Name</label>
        <input
          className={`modal-input ${localName.trim() ? "valid" : "invalid"}`}
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          placeholder="Team name"
          autoFocus
        />
        {!localName.trim() && (
          <span className="tsm-error">Team name is required</span>
        )}
      </div>

      {/* Visibility */}
      <div className="tsm-field">
        <label className="tsm-label">Visibility</label>
        <div className="tsm-toggle-row">
          <button
            className={`tsm-toggle-btn ${localPublic ? "active" : ""}`}
            onClick={() => setLocalPublic(true)}
          >
            Public
          </button>
          <button
            className={`tsm-toggle-btn ${!localPublic ? "active" : ""}`}
            onClick={() => setLocalPublic(false)}
          >
            Private
          </button>
        </div>
      </div>

      {/* Team Size */}
      <div className="tsm-field">
        <label className="tsm-label">Team Size</label>
        <div className="tsm-size-row">
          {[4, 5, 6, 7, 8].map((s) => (
            <button
              key={s}
              className={`tsm-size-btn ${localSize === s ? "active" : ""}`}
              onClick={() => setLocalSize(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="tsm-field">
        <label className="tsm-label">Tags</label>
        <div className="tsm-tag-groups">
          {TAG_GROUPS.map((group) => (
            <div key={group.label} className="tsm-tag-group">
              <span className="tsm-tag-group-label">{group.label}</span>
              <div className="tsm-tag-list">
                {group.tags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`tsm-tag ${localTags.includes(tag.id) ? "active" : ""}`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {saveMessage && (
        <p className={`tsm-message ${saveMessage.includes("Error") ? "error" : "success"}`}>
          {saveMessage}
        </p>
      )}

      <div className="btn-modal">
        <button
          className="btn-modal-cancel"
          onClick={isNewTeam ? () => navigate("/") : onClose}
        >
          Cancel
        </button>
        <button
          className={`btn-modal-confirm ${!canSave ? "disabled" : ""}`}
          onClick={isSaveMode ? handleSave : handleConfirm}
          disabled={!canSave}
        >
          {isSaveMode ? (isSaving ? "Saving..." : "Save") : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default TeamSettingsModal;
