const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword, displayName } = req.body;

    // 1. Basic validation
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

    // 2. Check if user already exists
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

    // 5. Response without sensitive data
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Find user and explicitly include passwordHash
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Account status checks
    if (user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "This account has been banned",
      });
    }

    if (user.status === "inactive") {
      if (
        user.deactivatedUntil &&
        user.deactivatedUntil.getTime() > Date.now()
      ) {
        return res.status(403).json({
          success: false,
          message: "This account is temporarily deactivated",
        });
      }
    }

    // 4. Password comparison
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

    // 5. Update metadata
    user.lastLoginAt = new Date();
    await user.save();

    // 6. Successful response (no sensitive data)
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
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


module.exports = router;
