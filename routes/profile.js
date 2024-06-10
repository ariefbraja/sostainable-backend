const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const jwtGenerator = require("../utils/jwtGenerator");

router.get("", async (req, res) => {
    try {
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(' ')[1];
        let verify = jwt.verify(token, process.env.jwtSecret);
        let username = verify.user.username;

        query = await pool.query("SELECT * FROM PENGGUNA WHERE username = $1", [username]);

        if (query.rows.length == 0) res.json({status: 404, message: "Profil tidak ditemukan"});

        return res.json({status: 201, data: query.rows[0]});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

router.post("/update", async (req, res) => {
    try {
        const { username, nama, tanggal_lahir, alamat, no_telepon, no_rekening, nama_bank } = req.body;
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(' ')[1];
        let verify = jwt.verify(token, process.env.jwtSecret);
        let oldUsername = verify.user.username;

        queryCheckUsername = await pool.query("SELECT * FROM pengguna where username = $1", [username]);
        if (queryCheckUsername.rows.length > 0 && username != oldUsername) return res.json({status: 500, message: "Username sudah digunakan!"});

        if (nama.length > 40) return res.json({status: 500, message: "Nama tidak boleh melebihi 40 karakter!"});

        await pool.query("UPDATE PENGGUNA SET username = $1, nama = $2, tanggal_lahir = $3, alamat = $4, no_telepon = $5, no_rekening = $6, nama_bank = $7", 
          [username, nama , tanggal_lahir, alamat, no_telepon, no_rekening, nama_bank]); 

        const jwtToken = jwtGenerator(username);

        return res.json({status: 200, message: "Berhasil mengubah data profile", token: jwtToken});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

module.exports = router;