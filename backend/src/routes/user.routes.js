const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const User = require("../models/User");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

/* ======================================================
   DIRECTORIES SETUP
====================================================== */

const AVATARS_DIR = path.join(__dirname, "..", "..", "uploads", "avatars");
const BANNERS_DIR = path.join(__dirname, "..", "..", "uploads", "banners");

if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

if (!fs.existsSync(BANNERS_DIR)) {
  fs.mkdirSync(BANNERS_DIR, { recursive: true });
}

/* ======================================================
   MULTER CONFIG
====================================================== */

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"), false);
  }
  cb(null, true);
};

/* ---------------- AVATAR STORAGE ---------------- */

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATARS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user_${req.user.id}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

/* ---------------- BANNER STORAGE ---------------- */

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BANNERS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `banner_${req.user.id}${ext}`);
  },
});

const uploadBanner = multer({
  storage: bannerStorage,
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});

/* ======================================================
   UPLOAD AVATAR
====================================================== */
router.patch("/me/avatar", requireAuth, async (req, res) => {
  try {
    const { type, value, index, variant } = req.body;

    const allowedTypes = [
      "default",
      "hero-ico",
      "hero-sw",
      "hero-ut",
      "hero-skill",
      "artifact",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid avatar type",
      });
    }

    const user = await User.findById(req.user.id);

    user.avatar = {
      type,
      value: type === "default" ? null : value,
      index: req.body.index ?? null,
      variant: req.body.variant ?? null
    };

    await user.save();

    res.json({ success: true, avatar: user.avatar });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update avatar",
    });
  }
});


/* ======================================================
   UPLOAD BANNER
====================================================== */

router.patch("/me/banner", requireAuth, async (req, res) => {
  try {
    const { type, value } = req.body;

    if (!["default", "hero"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner type",
      });
    }

    const user = await User.findById(req.user.id);

    user.banner = {
      type,
      value: type === "hero" ? value : null,
    };

    await user.save();

    res.json({ success: true, banner: user.banner });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update banner",
    });
  }
});

/* ======================================================
   UPDATE DISPLAY NAME
====================================================== */

router.patch("/me/display-name", requireAuth, async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName || displayName.length < 2 || displayName.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Invalid display name",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { displayName },
      { new: true }
    ).select("_id email displayName role profilePicture bannerPicture createdAt");

    res.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("Change display name error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ======================================================
   CHANGE PASSWORD
====================================================== */

router.patch("/me/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const user = await User.findById(req.user.id).select("+passwordHash");

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ======================================================
   CHANGE EMAIL
====================================================== */

router.patch("/me/email", requireAuth, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findById(req.user.id).select("+passwordHash");

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    user.email = email.toLowerCase();
    user.emailVerified = false;
    await user.save();

    res.json({ success: true });

  } catch (error) {
    console.error("Change email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ======================================================
   UPDATE PREFERENCES
====================================================== */

router.patch("/me/preferences", requireAuth, async (req, res) => {
  try {
    const allowedKeys = [
      "theme",
      "profileVisibility",
      "defaultTeamVisibility",
    ];

    const updates = {};

    for (const key of allowedKeys) {
      if (req.body[key]) {
        updates[`preferences.${key}`] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid preferences provided",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select("_id preferences");

    res.json({
      success: true,
      preferences: user.preferences,
    });

  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
