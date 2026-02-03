const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "dev-access-secret-change-me";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "dev-refresh-secret-change-me";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
