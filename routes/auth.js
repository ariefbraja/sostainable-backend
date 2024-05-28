const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../db");
const jwtGenerator = require("../utils/jwtGenerator");
const jwt = require("jsonwebtoken");
const validInfo = require("../middleware/validInfo");

router.post("/login", validInfo, async (req, res) => {
  let { username, password } = req.body;
  username = username.toLowerCase();

  try {
    let user = await pool.query("SELECT * FROM user WHERE username = $1", [username]); 

    if (user.rows.length == 0) return res.status(403).json({type: "WC", message: "Username atau Password Salah"});
    
    let validPassword = false;

    if (user.rows.length == 1) validPassword = await bcrypt.compare(password,user.rows[0].password);
    
    if (!validPassword) return res.status(500).json({type: "WC", message: "Username atau Password Salah"});
    
    const jwtToken = jwtGenerator(username, role);

    return res.json({ jwtToken });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error from login auth.");
  }
});


module.exports = router;
