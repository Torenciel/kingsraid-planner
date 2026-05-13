import { useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import "./TeamSettingsModal.css";

const TAG_GROUPS = [
  {
    id: "wb",
    label: "World Boss",
    tags: [
      { id: "wb_mountain", name: "WB1 – Mountain Fortress" },
      { id: "wb_protianus", name: "WB2 – Protianus" },
      { id: "wb_xanadus", name: "WB3 – Xanadus" },
    ],
  },
  {
    id: "raid",
    label: "Raid",
    tags: [
      { id: "raid_black", name: "Black Dragon" },
      { id: "raid_fire", name: "Fire Dragon" },
      { id: "raid_frost", name: "Frost Dragon" },
      { id: "raid_poison", name: "Poison Dragon" },
    ],
  },
  {
    id: "gc",
    label: "Guild Conquest",
    tags: [
      { id: "gc_lakreil", name: "Lakreil" },
      { id: "gc_tyrfas", name: "Tyrfas" },
      { id: "gc_velkazar", name: "Velkazar" },
    ],
  },
  {
    id: "gr",
    label: "Guild Raid",
    tags: [
      { id: "gr_gushak", name: "Gushak" },
      { id: "gr_lakreil", name: "Lakreil" },
      { id: "gr_manticore", name: "Manticore" },
      { id: "gr_maviel", name: "Maviel" },
      { id: "gr_nordik", name: "Nordik" },
      { id: "gr_nubis", name: "Nubis" },
      { id: "gr_tyrfas", name: "Tyrfas" },
      { id: "gr_Xakios", name: "Xakios" },
    ],
  },
  {
    id: "trial",
    label: "Trial",
    tags: [
      { id: "trial_imet", name: "Imet" },
      { id: "trial_musama", name: "Musama" },
      { id: "trial_sekmaha", name: "Sekmaha" },
    ],
  },
  {
    id: "shakmeh",
    label: "Shakmeh",
    tags: [
      { id: "devourer_shakmeh", name: "Devourer" },
      { id: "otherworldly_shakmeh", name: "Otherworldly" },
    ],
  },
  {
    id: "story",
    label: "Story",
    tags: [
      { id: "story_ch1", name: "Chapter 1" },
      { id: "story_ch2", name: "Chapter 2" },
      { id: "story_ch3", name: "Chapter 3" },
    ],
  },
  {
    id: "pvp",
    label: "PvP",
    tags: [
      { id: "league_of_victory", name: "League of Victory" },
      { id: "league_of_honor", name: "League of Honor" },
    ],
  },
  {
    id: "other",
    label: "Other",
    tags: [
      { id: "other_farming", name: "Farming" },
      { id: "other_event", name: "Event" },
    ],
  },
];

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

  const { onSaved } = data || {};

  const [localName, setLocalName] = useState(teamName || "New Team");
  const [localPublic, setLocalPublic] = useState(isPublic ?? false);
  const [localSize, setLocalSize] = useState(teamSize);
  const [localTags, setLocalTags] = useState(tags || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const toggleTag = (id) => {
    setLocalTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!localName.trim()) return;

    setTeamName(localName.trim());
    setIsPublic(localPublic);
    setTags(localTags);
    if (localSize !== teamSize) changeTeamSize(localSize);

    setIsSaving(true);
    setSaveMessage("Saving...");

    const result = await saveTeam(localName.trim(), {
      tags: localTags,
      isPublic: localPublic,
    });

    setIsSaving(false);
    if (result.success) {
      setSaveMessage("Team saved!");
      setTimeout(() => {
        onClose();
        if (onSaved) onSaved(result);
      }, 1200);
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
            className={`tsm-toggle-btn ${!localPublic ? "active" : ""}`}
            onClick={() => setLocalPublic(false)}
          >
            Private
          </button>
          <button
            className={`tsm-toggle-btn ${localPublic ? "active" : ""}`}
            onClick={() => setLocalPublic(true)}
          >
            Public
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
        <button className="btn-modal-cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          className={`btn-modal-confirm ${!canSave ? "disabled" : ""}`}
          onClick={handleSave}
          disabled={!canSave}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default TeamSettingsModal;
