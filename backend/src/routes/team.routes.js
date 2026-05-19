const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/auth.middleware");

let Team, teamConverter, User;
try {
  Team = require("../../src/models/Team");
  teamConverter = require("../../src/utils/teamConverter");
  User = require("../../src/models/User");
} catch (error) {
  console.error("Modules not loaded:", error.message);
}

// Create team (authenticated)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { teamData } = req.body;

    if (!teamData) {
      return res.status(400).json({
        success: false,
        error: "teamData is required",
      });
    }

    const dbTeamData = teamConverter.convertTeamContextToDB(
      teamData,
      teamData.teamTitle || "My Team",
      req.user.displayName,
    );
    console.log("dbTeamData.isPublic AFTER CONVERT:", dbTeamData.isPublic);

    dbTeamData.author = req.user.id;
    dbTeamData.createdBy = req.user.displayName;

    const team = new Team(dbTeamData);

    await team.validate();
    const savedTeam = await team.save();

    res.status(201).json({
      success: true,
      message: "Team saved successfully",
      teamId: savedTeam._id,
      team: savedTeam.toAPIFormat(),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get team by id or slug
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    let team;

    // If it looks like Mongo ObjectId → search by id
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      team = await Team.findById(identifier);
    } else {
      // Otherwise treat as slug
      team = await Team.findOne({ slug: identifier });
    }

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    // Increment views only when accessed publicly
    team.views += 1;
    await team.save();

    res.json({
      success: true,
      team: team.toAPIFormat(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update team (author only)
router.patch("/:slug", requireAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { teamData } = req.body;

    if (!teamData) {
      return res.status(400).json({
        success: false,
        error: "teamData is required",
      });
    }

    const team = await Team.findOne({ slug });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    // Author check
    if (team.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You are not allowed to edit this team",
      });
    }

    // Convert context data to DB format
    const dbTeamData = teamConverter.convertTeamContextToDB(
      teamData,
      teamData.teamTitle || team.name,
      req.user.displayName,
    );

    // Update fields
    team.name = dbTeamData.name;
    team.description = dbTeamData.description;
    team.teamSize = dbTeamData.teamSize;
    team.heroes = dbTeamData.heroes;
    team.tags = dbTeamData.tags;
    team.authorNotes = dbTeamData.authorNotes;
    team.isPublic = dbTeamData.isPublic;

    await team.save();

    res.json({
      success: true,
      message: "Team updated successfully",
      team: team.toAPIFormat(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// List teams with filtering
router.get("/", async (req, res) => {
  try {
    const { isPublic, createdBy, author, bookmarkedBy } = req.query;
    console.log("Teams query:", { isPublic, createdBy, author, bookmarkedBy });

    // Build filter object
    const filter = {};

    if (bookmarkedBy) {
      // Return only teams bookmarked by this user
      const user = await User.findById(bookmarkedBy).select("bookmarkedTeams");
      if (!user) {
        return res.json({ success: true, count: 0, teams: [] });
      }
      const bookmarkedIds = user.bookmarkedTeams.map((b) => b.teamId);
      filter._id = { $in: bookmarkedIds };
    } else if (author) {
      // If author ID is specified, show all teams by that user (both public and private)
      filter.author = author;
    } else if (createdBy) {
      // Fallback to createdBy for backwards compatibility
      filter.createdBy = createdBy;
    } else {
      // If no author/createdBy filter, only show public teams by default
      filter.isPublic = true;
    }

    // If isPublic is explicitly provided and no author/bookmarkedBy filter, apply it
    if (isPublic !== undefined && !author && !createdBy && !bookmarkedBy) {
      filter.isPublic = isPublic === "true";
    }

    console.log("MongoDB filter:", filter);
    const startTime = Date.now();

    const teams = await Team.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const queryTime = Date.now() - startTime;
    console.log(`Query completed in ${queryTime}ms, found ${teams.length} teams`);

    res.json({
      success: true,
      count: teams.length,
      teams: teams.map((t) => ({
        id: t._id,
        name: t.name,
        slug: t.slug,
        teamSize: t.teamSize,
        heroes: t.heroes || [],
        tags: t.tags || [],
        upvotes: t.upvotes || 0,
        bookmarks: t.bookmarks || 0,
        author: t.author,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        isPublic: t.isPublic,
      })),
    });
  } catch (error) {
    console.error("Teams query error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete team (author only)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: "Team not found" });

    if (team.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "You are not allowed to delete this team" });
    }

    await Team.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Team deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle bookmark (authenticated)
router.post("/:id/bookmark", requireAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: "Team not found" });

    const user = await User.findById(req.user.id);
    const alreadyBookmarked = user.bookmarkedTeams.some(
      (b) => b.teamId.toString() === team._id.toString()
    );

    if (alreadyBookmarked) {
      user.bookmarkedTeams = user.bookmarkedTeams.filter(
        (b) => b.teamId.toString() !== team._id.toString()
      );
      team.bookmarks = Math.max(0, (team.bookmarks || 0) - 1);
    } else {
      user.bookmarkedTeams.push({ teamId: team._id });
      team.bookmarks = (team.bookmarks || 0) + 1;
    }

    await Promise.all([user.save(), team.save()]);

    res.json({ success: true, bookmarked: !alreadyBookmarked, bookmarks: team.bookmarks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle upvote (authenticated)
router.post("/:id/upvote", requireAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: "Team not found" });

    const user = await User.findById(req.user.id);
    const alreadyUpvoted = user.upvotedTeams
      ? user.upvotedTeams.some((id) => id.toString() === team._id.toString())
      : false;

    if (alreadyUpvoted) {
      user.upvotedTeams = user.upvotedTeams.filter(
        (id) => id.toString() !== team._id.toString()
      );
      team.upvotes = Math.max(0, (team.upvotes || 0) - 1);
    } else {
      if (!user.upvotedTeams) user.upvotedTeams = [];
      user.upvotedTeams.push(team._id);
      team.upvotes = (team.upvotes || 0) + 1;
    }

    await Promise.all([user.save(), team.save()]);

    res.json({ success: true, upvoted: !alreadyUpvoted, upvotes: team.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
