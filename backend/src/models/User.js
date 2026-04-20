const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // === IDENTITY & AUTH ===
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    // login must be requested this way: User.findOne({ email }).select("+passwordHash");

    emailVerified: {
      type: Boolean,
      default: false,
    },

    // === EMAIL VERIFICATION ===
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    emailVerificationLastSentAt: {
      type: Date,
      select: false,
    },

    // === PASSWORD RESET ===
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },

    // === OAUTH ===
    googleId: {
      type: String,
      sparse: true,
    },
    oauthProvider: {
      type: String,
      enum: ["google"],
    },

    // === PUBLIC PROFILE ===
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 20,
    },

    // === PROFILE MEDIA ===
    avatar: {
      type: {
        type: String,
        default: "default",
      },
      value: {
        type: String,
        default: null,
      },
      index: {
        type: Number,
        default: null,
      },
      variant: {
        type: Number,
        default: null,
      },
    },

    banner: {
      type: {
        type: String,
        enum: ["default", "hero"],
        default: "default",
      },
      value: {
        type: String,
        default: null,
      },
    },

    // === SECURITY & STATUS ===
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },

    // deactivation logic is in a method
    deactivationReason: String,
    deactivatedAt: Date,
    deactivatedUntil: Date,

    // === PREFERENCES ===
    preferences: {
      theme: {
        type: String,
        enum: ["dark", "light"],
        default: "dark",
      },
      profileVisibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },
      defaultTeamVisibility: {
        type: String,
        enum: ["private", "public"],
        default: "public",
      },
    },

    // === STATISTICS ===
    stats: {
      teamsCreatedCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    // other stats such as upvoteReceived and bookmarkReceived can be computed dynamically

    // === LISTING ===
    // bookmark limit is enforced outiside of the model
    bookmarkedTeams: [
      {
        teamId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
        bookmarkedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // === METADATA ===
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", UserSchema);
