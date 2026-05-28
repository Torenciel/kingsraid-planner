const { verifyAccessToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        authenticated: false,
        message: "Authentication required",
      });
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.sub,
      role: decoded.role,
      displayName: decoded.displayName,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      authenticated: false,
      message: "Invalid or expired token",
    });
  }
}

// Decodes token if present but never blocks the request
function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.sub,
        role: decoded.role,
        displayName: decoded.displayName,
      };
    }
  } catch {
    // Invalid token — treat as unauthenticated
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
};
