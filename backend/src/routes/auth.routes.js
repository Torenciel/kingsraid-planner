const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { requireAuth } = require("../middlewares/auth.middleware");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const router = express.Router();

// ================= REGISTER ================= POST /api/v2/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword, displayName } = req.body;

    // 1. Validation
    if (!email || !password || !confirmPassword || !displayName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // 2. Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create user
    const user = await User.create({
      email,
      displayName,
      passwordHash,
    });

    // 5. SIGN TOKENS (NEW)
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // 6. SET COOKIES (NEW)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Response
    res.status(201).json({
      success: true,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});

// ================= LOGIN (JWT) ================= POST /api/v2/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "This account has been banned",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

// ================= ME ================= GET /api/v2/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "_id email displayName role profilePicture createdAt"
    );

    if (!user) {
      return res.status(401).json({
        authenticated: false,
      });
    }

    res.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({
      authenticated: false,
      message: "Server error",
    });
  }
});


// ================= LOGOUT ================= POST /api/v2/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ success: true });
});

module.exports = router;
