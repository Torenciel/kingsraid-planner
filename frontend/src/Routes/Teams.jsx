import { useEffect, useState } from "react";
import { FaBookmark, FaSearch, FaTrash } from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TeamList from "../components/TeamViewer/TeamList";
import { useAuth } from "../contexts/AuthContext";
import { TAG_GROUPS } from "../constants/tagGroups";
import "./Teams.css";

const Teams = () => {
  const { tab = "private", content = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Parse content from URL for navbar links
  const initialContent = content ? content.split("+") : [];

  const [activeTab, setActiveTab] = useState(tab);
  const [selectedContent, setSelectedContent] = useState(initialContent);
  const [selectedSubFilters, setSelectedSubFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [teamCount, setTeamCount] = useState(0);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const contentOptions = TAG_GROUPS.map((group) => ({
    id: group.id,
    name: group.label,
    subFilters: group.tags.map((tag) => ({ id: tag.id, name: tag.name, image: tag.image })),
  }));

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(tab);
    if (tab !== activeTab) {
      const newContent = content ? content.split("+") : [];
      setSelectedContent(newContent);
      setSelectedSubFilters({});
    }
  }, [tab, content, location.key]);

  // Clear sub-filters when main content filter is removed
  useEffect(() => {
    const updatedSubFilters = { ...selectedSubFilters };
    let hasChanges = false;

    Object.keys(updatedSubFilters).forEach((contentId) => {
      if (!selectedContent.includes(contentId)) {
        delete updatedSubFilters[contentId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setSelectedSubFilters(updatedSubFilters);
    }
  }, [selectedContent]);

  // Handle main content checkbox change
  const handleContentChange = (contentId) => {
    setSelectedContent((prev) => {
      if (prev.includes(contentId)) {
        return prev.filter((id) => id !== contentId);
      } else {
        return [...prev, contentId];
      }
    });
  };

  // Handle sub-filter selection
  const handleSubFilterChange = (contentId, subFilterId) => {
    setSelectedSubFilters((prev) => {
      const currentSubFilters = prev[contentId] || [];

      if (currentSubFilters.includes(subFilterId)) {
        // Remove sub-filter
        const updated = currentSubFilters.filter((id) => id !== subFilterId);

        if (updated.length === 0) {
          // Remove the content entry if no sub-filters left
          const newState = { ...prev };
          delete newState[contentId];
          return newState;
        }

        return { ...prev, [contentId]: updated };
      } else {
        // Add sub-filter
        return { ...prev, [contentId]: [...currentSubFilters, subFilterId] };
      }
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedContent([]);
    setSelectedSubFilters({});
    setSearchQuery("");
    setShowBookmarks(false);
  };

  // Make filter tags clickable to remove
  const handleFilterTagClick = (contentId) => {
    setSelectedContent((prev) => prev.filter((id) => id !== contentId));
  };

  // Make sub-filter tags clickable to remove
  const handleSubFilterTagClick = (contentId, subFilterId) => {
    handleSubFilterChange(contentId, subFilterId);
  };

  // Clear search and bookmark filter when tab changes
  useEffect(() => {
    setSearchQuery("");
    setShowBookmarks(false);
  }, [activeTab]);

  // Select all content (does NOT deselect)
  const handleSelectAll = () => {
    setSelectedContent(contentOptions.map((option) => option.id));
  };

  // Helper to get all selected sub-filters as a flat array
  const getAllSelectedSubFilters = () => {
    return Object.values(selectedSubFilters).flat();
  };

  // Image error handler function
  const handleImageError = (e) => {
    e.target.style.display = "none";
    const nextSibling = e.target.nextElementSibling;
    if (nextSibling) {
      nextSibling.style.display = "flex";
    }
  };

  return (
    <div className="teams-container">
      {/* ===== BINDER TABS ===== */}
      <div className="binder-tabs-container">
        <div className="binder-tabs">
          <button
            className={`binder-tab ${activeTab === "private" ? "active" : ""}`}
            onClick={() => navigate("/teams/private")}
          >
            My Teams
          </button>
          <button
            className={`binder-tab ${activeTab === "public" ? "active" : ""}`}
            onClick={() => navigate("/teams/public")}
          >
            Public Teams
          </button>
        </div>
      </div>

      {/* ===== FILTERS GRID ===== */}
      <div className="filters-section">
        {/* ===== LEFT COLUMN ===== */}
        <div className="filters-left">
          <div className="content-checkboxes">
            {contentOptions.map((content) => (
              <label key={content.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedContent.includes(content.id)}
                  onChange={() => handleContentChange(content.id)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">{content.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ===== CENTER COLUMN ===== */}
        <div className="filters-center">
          {/* TOP BAR */}
          <div className="filters-top">
            {activeTab === "public" && user && (
              <button
                className={`square-btn bookmark-filter-btn${showBookmarks ? " active" : ""}`}
                onClick={() => setShowBookmarks((prev) => !prev)}
                title={
                  showBookmarks ? "Show all teams" : "Show bookmarked teams"
                }
              >
                <FaBookmark />
              </button>
            )}
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search a team or a hero`}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <button
              className="square-btn clear-filters-btn"
              onClick={handleClearFilters}
              disabled={
                selectedContent.length === 0 &&
                Object.keys(selectedSubFilters).length === 0 &&
                searchQuery === ""
              }
              title="Clear all filters"
            >
              <FaTrash />
            </button>
          </div>

          {/* SUB FILTERS – SCROLL VERTICAL */}
          <div className="sub-filters-wrapper">
            {selectedContent.filter((contentId) => {
              const content = contentOptions.find((c) => c.id === contentId);
              return (
                content && content.subFilters && content.subFilters.length > 0
              );
            }).length === 0 ? (
              <div className="sub-filters-tutorial">
                Placeholder tutorial on how to use filters
              </div>
            ) : (
              <div className="sub-filters-container">
                {selectedContent
                  .filter((contentId) => {
                    const content = contentOptions.find(
                      (c) => c.id === contentId,
                    );
                    return (
                      content &&
                      content.subFilters &&
                      content.subFilters.length > 0
                    );
                  })
                  .map((contentId) => {
                    const content = contentOptions.find(
                      (c) => c.id === contentId,
                    );
                    const selectedSubs = selectedSubFilters[contentId] || [];

                    return (
                      <div key={contentId} className="sub-filter-section">
                        <div className="sub-filter-title">{content.name}</div>

                        <div className="sub-filter-items">
                          {content.subFilters.map((subFilter) => {
                            const isSelected = selectedSubs.includes(
                              subFilter.id,
                            );
                            return (
                              <button
                                key={subFilter.id}
                                className={`sub-filter-item ${isSelected ? "selected" : ""}`}
                                onClick={() =>
                                  handleSubFilterChange(contentId, subFilter.id)
                                }
                              >
                                {subFilter.image ? (
                                  <img
                                    src={subFilter.image}
                                    alt={subFilter.name}
                                    className="sub-filter-image"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <div className="sub-filter-image-placeholder">
                                    {subFilter.name.charAt(0)}
                                  </div>
                                )}

                                <div className="sub-filter-name-overlay">
                                  {subFilter.name}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="filters-right">
          <div className="active-filters">
            <span className="active-filters-label">Active filters</span>
            <div className="filter-tags">
              {/* Main content filters */}
              {selectedContent.map((contentId) => {
                const content = contentOptions.find((c) => c.id === contentId);
                return (
                  <button
                    key={contentId}
                    className="filter-tag"
                    onClick={() => handleFilterTagClick(contentId)}
                  >
                    <span className="filter-tag-content">{content?.name}</span>
                  </button>
                );
              })}

              {/* Sub-filters */}
              {Object.entries(selectedSubFilters).map(
                ([contentId, subFilterIds]) => {
                  const content = contentOptions.find(
                    (c) => c.id === contentId,
                  );
                  return subFilterIds.map((subFilterId) => {
                    const subFilter = content?.subFilters?.find(
                      (s) => s.id === subFilterId,
                    );
                    return subFilter ? (
                      <button
                        key={`${contentId}-${subFilterId}`}
                        className="filter-tag sub-filter-tag"
                        onClick={() =>
                          handleSubFilterTagClick(contentId, subFilterId)
                        }
                      >
                        <span className="filter-tag-content">
                          {content.name}: {subFilter.name}
                        </span>
                      </button>
                    ) : null;
                  });
                },
              )}
            </div>
          </div>
          {/* Team-count */}
          <div className="content-type-header">
            <div className="teams-count-header">
              <h3 className="teams-count-header-text">
                {teamCount}{" "}
                <span className="teams-count-header-span">teams</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      <TeamList
        tab={activeTab}
        searchQuery={searchQuery}
        onCountChange={setTeamCount}
        selectedContent={selectedContent}
        selectedSubFilters={selectedSubFilters}
        contentOptions={contentOptions}
        showBookmarks={showBookmarks}
      />
    </div>
  );
};

export default Teams;
