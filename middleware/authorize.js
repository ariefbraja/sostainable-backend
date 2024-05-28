const jwt = require("jsonwebtoken");
require("dotenv").config();

// this middleware will on continue on if the token is inside the local storage

module.exports = function(req, res, next) {
  // Get token from header
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(' ')[1];

  // Check if not token not exist
  if (!token) {
    return res.status(403).json({ msg: "authorization denied" });
  }

  // Verify token
  try {
    const verify = jwt.verify(token, process.env.jwtSecret);

    req.user = verify.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};