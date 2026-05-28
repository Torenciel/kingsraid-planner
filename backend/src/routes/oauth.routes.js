const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();

const User = require("../models/User");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");

// In-memory state store (state -> timestamp)
// In production, use Redis or session store
const stateStore = new Map();
const STATE_TTL = 30 * 60 * 1000; // 30 minutes (longer for dev)

// Clean up expired states periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [state, timestamp] of stateStore.entries()) {
      if (now - timestamp > STATE_TTL) {
        stateStore.delete(state);
      }
    }
  },
  5 * 60 * 1000,
); // Clean every 5 minutes

/* ======================================================
   GET /api/v2/oauth/google/url
   Returns Google OAuth redirect URL
====================================================== */
router.get("/google/url", (req, res) => {
  try {
    // Generate random state for CSRF protection
    const state = require("crypto").randomBytes(32).toString("hex");
    stateStore.set(state, Date.now());

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri:
        process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:5173/oauth/google/callback",
      response_type: "code",
      scope: "openid email profile",
      state: state,
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    res.json({ success: true, url });
  } catch (error) {
    console.error("Error generating Google OAuth URL:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate OAuth URL" });
  }
});

/* ======================================================
   POST /api/v2/oauth/google/callback
   Exchanges code for user info and logs in
====================================================== */
router.post("/google/callback", async (req, res) => {
  const { code, state } = req.body;

  if (!code || !state) {
    return res
      .status(400)
      .json({ success: false, error: "Missing code or state" });
  }

  // Verify state parameter (CSRF protection)
  if (!stateStore.has(state)) {
    return res
      .status(403)
      .json({ success: false, error: "Invalid or expired state parameter" });
  }
  // Don't delete state yet - keep for potential replay checks

  try {
    // Exchange code for token
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri:
          process.env.GOOGLE_REDIRECT_URI ||
          "http://localhost:5173/oauth/google/callback",
        grant_type: "authorization_code",
      },
    );

    const { id_token } = tokenResponse.data;

    // Decode ID token to get user info
    // Note: In production, you should verify the JWT signature
    const decoded = jwt.decode(id_token);

    const { sub: googleId, email, name } = decoded;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "No email from Google" });
    }

    // EMAIL-BASED LINKING LOGIC
    // 1. Check if user with this googleId exists
    let user = await User.findOne({ googleId });

    // 2. If not, check if user with same email exists
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        // Link existing account to Google
        user.googleId = googleId;
        user.oauthProvider = "google";
        user.emailVerified = true;
        await user.save();
      } else {
        // 3. Create new user
        const randomPassword = require("crypto")
          .randomBytes(32)
          .toString("hex");
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        user = new User({
          email: email.toLowerCase(),
          displayName: name || email.split("@")[0],
          googleId,
          oauthProvider: "google",
          emailVerified: true,
          passwordHash,
        });
        await user.save();
      }
    }

    // Check user status
    if (user.status === "banned") {
      return res
        .status(403)
        .json({ success: false, error: "Account is banned" });
    }
    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ success: false, error: "Account is inactive" });
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    // Issue JWT tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // Set cookies (same as password login)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data (same format as password login)
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
    console.error("OAuth callback error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Authentication failed",
      });
  }
});

module.exports = router;
