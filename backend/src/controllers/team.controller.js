const Team = require("../models/Team");

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

exports.getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ author: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: teams.map(team => team.toAPIFormat())
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
