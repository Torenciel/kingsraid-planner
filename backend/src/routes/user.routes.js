const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const User = require("../models/User");
const { requireAuth } = require("../middlewares/auth.middleware");


const router = express.Router();

// ================= MULTER CONFIG =================

const AVATARS_DIR = path.join(__dirname, "..", "..", "uploads", "avatars");

// Ensure avatars directory exists
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATARS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user_${req.user.id}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
});

// ================= UPLOAD AVATAR =================

router.post(
  "/me/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image provided",
        });
      }

      const relativePath = `uploads/avatars/${req.file.filename}`;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update profile picture path
      user.profilePicture = relativePath;
      await user.save();

      res.json({
        success: true,
        profilePicture: relativePath,
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload avatar",
      });
    }
  }
);

// PATCH /api/v2/users/me/display-name
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
    ).select("_id email displayName role profilePicture createdAt");

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


// PATCH /api/v2/users/me/password
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

    const isValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// PATCH /api/v2/users/me/email
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

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Change email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
