const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const ImgUpload = require("../middleware/imgUpload");
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1 * 1024 * 1024 } // 1 MB file size limit
}).array('file_foto', 3);

router.get("", async (req, res) => {
    try {
        let query = "SELECT id_event, judul_event, foto_lokasi[1], deskripsi, username AS pembuat_event FROM event";
        let event = await pool.query(query);

        if (event.rowCount === 0) {
            return res.status(404).json({status: 404, message: "Belum ada event yang aktif"});
        }

        return res.json({status: 200, message: "Pengambilan Data Berhasil", data: event.rows});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

router.get("/detail/:id_event", async (req, res) => {
    try {
        let { id_event } = req.params;
        let query = `SELECT 
                        id_event, judul_event, foto_lokasi, deskripsi, jam_mulai, jam_selesai, tanggal_mulai, tanggal_selesai, alamat, jumlah_minimum_volunteer, jumlah_minimum_donasi, 
                        username AS pembuat_event 
                    FROM 
                        event
                    WHERE
                        id_event = $1`;
        let event = await pool.query(query, [id_event]);

        if (event.rowCount === 0) {
            return res.status(404).json({status: 404, message: `Event ${id_event} tidak ditemukan`});
        }

        return res.json({status: 200, message: "Pengambilan Data Berhasil", data: event.rows[0]});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

router.post("/create", (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: 400,
                    message: 'Size foto melebihi 1 MB'
                });
            }
            return res.status(500).json({
                status: 500,
                message: err.message
            });
        }

        try {
            let { judul_event, tipe_lokasi, deskripsi, jam_mulai, jam_selesai, tanggal_mulai, tanggal_selesai, alamat, jumlah_minimum_volunteer, jumlah_minimum_donasi } = req.body;
            const authHeader = req.header("Authorization");
            const token = authHeader && authHeader.split(' ')[1];
            let verify = jwt.verify(token, process.env.jwtSecret);
            let username = verify.user.username;

            const areAllVariablesDefined = (...vars) => vars.every(v => v !== undefined && v !== null);

            if (!areAllVariablesDefined(
                judul_event,
                tipe_lokasi, 
                deskripsi, 
                jam_mulai, 
                jam_selesai, 
                tanggal_mulai, 
                tanggal_selesai, 
                alamat, 
                jumlah_minimum_volunteer, 
                jumlah_minimum_donasi
            )) {
                return res.status(400).json({
                    status: 400,
                    message: "All fields are required 22222"
                });
            }

            let query = "SELECT COUNT(*) as jumlah_event FROM event WHERE id_event LIKE $1";
            let jumlah_event = (await pool.query(query, [`${tipe_lokasi.toUpperCase()}%`])).rows[0].jumlah_event;
            let id_event = `${tipe_lokasi.toUpperCase()}-${(parseInt(jumlah_event) + 1).toString().padStart(3, '0')}`;

            ImgUpload.uploadToGcs(id_event)(req, res, async (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({
                        status: 500,
                        message: err.message
                    });
                }
            
                // Get the file URL and push it to the array
                const foto_lokasi = req.files.map(file => file.cloudStoragePublicUrl);
            
                // Insert the event into the database
                const query = "INSERT INTO EVENT VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
                await pool.query(query, [id_event, judul_event, foto_lokasi, alamat, deskripsi, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, jumlah_minimum_volunteer, jumlah_minimum_donasi, username]);
            
                // Return success response
                return res.json({
                    status: 201,
                    message: "Event berhasil dibuat"
                });
            });

        } catch (err) {
            console.error(err.message);
            return res.status(500).json({
                status: 500,
                message: err.message
            });
        }
    });
});


module.exports = router;