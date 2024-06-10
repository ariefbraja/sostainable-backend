const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

router.get("", async (req, res) => {
    try {
        let query = "SELECT id_event, judul_event, foto_lokasi, deskripsi_event, username AS pembuat_event FROM event";
        let event = await pool.query(query);

        if (event.rowCount === 0) {
            return res.status(404).json({status: 400, message: "Belum ada event yang aktif"});
        }

        return res.json({status: 200, message: "Pengambilan Data Berhasil", data: event.rows});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

router.post("/create", async(req, res) => {
    try {
        let { judul_event, tipe_lokasi, deskripsi_event, jam_mulai, jam_selesai, tanggal_mulai, tanggal_selesai, alamat, jumlah_minimum_volunteer, jumlah_minimum_donasi } = req.body;
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(' ')[1];
        let verify = jwt.verify(token, process.env.jwtSecret);
        let username = verify.user.username;

        const areAllVariablesDefined = (...vars) => vars.every(v => v !== undefined && v !== null);

        if (!areAllVariablesDefined(
            judul_event,
            tipe_lokasi, 
            deskripsi_event, 
            jam_mulai, 
            jam_selesai, 
            tanggal_mulai, 
            tanggal_selesai, 
            alamat, 
            jumlah_minimum_volunteer, 
            jumlah_minimum_donasi
        )) {
            return res.status(400).json({status: 400, message: "All fields are required" });
        }

        let query = "SELECT COUNT(*) as jumlah_event FROM event WHERE id_event LIKE $1";
        jumlah_event = (await pool.query(query, [`${tipe_lokasi.toUpperCase()}%`])).rows[0].jumlah_event;
        let id_event = `${tipe_lokasi.toUpperCase()}-${(parseInt(jumlah_event)+1).toString().padStart(3, '0')}`;
        // query = "INSERT INTO EVENT VALUES ($1, $2, )";
        // await pool.query(query, [judul_event, deskripsi_event, jam_mulai, jam_selesai, tanggal_mulai, tanggal_selesai, alamat, jumlah_minimum_volunteer, jumlah_minimum_donasi, username]);

        console.log("INI ID EVENT " + id_event);

        return res.json({status: 201, message: "Event berhasil dibuat"});


    } catch (err) {
        console.error(err.message);
        return res.status(500).json({status: 500, message: err.message});
      }
})

module.exports = router;