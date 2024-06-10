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
    let user = await pool.query("SELECT * FROM pengguna WHERE username = $1", [username]); 

    if (user.rows.length == 0) return res.status(403).json({type: "WC", message: "Username atau Password Salah"});
    
    let validPassword = false;

    if (user.rows.length == 1) validPassword = await bcrypt.compare(password,user.rows[0].password);
    
    if (!validPassword) return res.status(500).json({type: "WC", message: "Username atau Password Salah"});
    
    const jwtToken = jwtGenerator(username);

    return res.json({ jwtToken });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error from login auth.");
  }
});

router.post("/register", async (req, res) => {
  let { username, password, tanggal_lahir, alamat, no_telepon, no_rekening, nama_bank } = req.body;
  username = username.toLowerCase();

  try {
    let user = await pool.query("SELECT * FROM pengguna WHERE username = $1", [username]); 

    if (user.rows.length > 0) return res.status(500).json({type: "UE", message: "Username sudah pernah digunakan"});
    
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    await pool.query("INSERT INTO pengguna (username, password, tanggal_lahir, alamat, no_telepon, no_rekening, nama_bank) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [username, encryptedPassword, tanggal_lahir, alamat, no_telepon, no_rekening, nama_bank]
    );

    return res.json({ type: "S", message: "Register success"});

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error from register auth.");
  }
});


module.exports = router;