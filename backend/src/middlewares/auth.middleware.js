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
    };

    next();
  } catch (error) {
    return res.status(401).json({
      authenticated: false,
      message: "Invalid or expired token",
    });
  }
}

module.exports = {
  requireAuth,
};
