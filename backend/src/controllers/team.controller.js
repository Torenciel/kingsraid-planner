const Team = require("../models/Team");


// === CREATE TEAM ===
// Creates a new team linked to the authenticated user, stores only configuration (no metadata or duplication).

exports.createTeam = async (req, res) => {
  try {
    const team = new Team({
      ...req.body,
      author: req.user.id,
      createdBy: req.user.displayName
    });

    await team.save();

    res.status(201).json({
      success: true,
      data: team.toAPIFormat()
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Validation error",
      details: error.errors
    });
  }
};



// === GET MY TEAMS (PAGINATED) (Private dashboard) ===
// Returns only teams created by the logged-in user, uses mongoose-paginate for scalability. (TeamPreviewCard)

exports.getMyTeams = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const result = await Team.paginate(
      { author: req.user.id },
      {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        lean: true
      }
    );

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// === GET PUBLIC TEAM PREVIEWS (PAGINATED + LIGHTWEIGHT) (Team list)===
// Used for listing page (TeamPreviewCard), only returns necessary fields for performance.

exports.getPublicTeamPreviews = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const result = await Team.paginate(
      { isPublic: true },
      {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        select:
          "name createdBy createdAt tags heroes.heroSlug heroes.slotPosition views upvotes bookmarks",
        lean: true
      }
    );

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load team previews"
    });
  }
};



// === GET TEAMS BY USERNAME (PUBLIC PROFILE PAGE) ===
// Used for public profile page: /profile/:username (TeamPreviewCard)
// Returns ONLY public teams of that user (paginated + lightweight preview format)

exports.getTeamsByUser = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const { username } = req.params;

    const result = await Team.paginate(
      { createdBy: username, isPublic: true },
      {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        select:
          "name createdBy createdAt tags heroes.heroSlug heroes.slotPosition views upvotes bookmarks",
        lean: true
      }
    );

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load user teams"
    });
  }
};



// === GET TEAM BY ID (FULL TEAM VIEW) ===
// Used for TeamView page, returns full team configuration.

exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).lean();

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    res.json({
      success: true,
      data: team
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load team"
    });
  }
};
