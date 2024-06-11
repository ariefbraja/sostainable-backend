const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const jwtGenerator = require("../utils/jwtGenerator");
const ImgUpload = require("../middleware/imgUpload");
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 } // 1 MB file size limit
}).single('foto_profil');

const customMulterMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
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
    next();
  });
};

router.get("", async (req, res) => {
    try {
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(' ')[1];
        let verify = jwt.verify(token, process.env.jwtSecret);
        let username = verify.user.username;

        query = await pool.query("SELECT * FROM PENGGUNA WHERE username = $1", [username]);

        if (query.rows.length == 0) res.status(404).json({status: 404, message: "Profil tidak ditemukan"});

        return res.json({status: 201, data: query.rows[0]});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

router.put("/update", customMulterMiddleware, async (req, res) => {
    try {
        const { username, nama, tanggal_lahir, alamat, no_telepon, no_rekening, nama_bank } = req.body;
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(' ')[1];
        let verify = jwt.verify(token, process.env.jwtSecret);
        let oldUsername = verify.user.username;

        queryCheckUsername = await pool.query("SELECT * FROM pengguna where username = $1", [username]);
        if (queryCheckUsername.rowCount > 0 && username != oldUsername) return res.status(400).json({status: 400, message: "Username sudah digunakan!"});

        if (nama.length > 40) return res.status(400).json({status: 400, message: "Nama tidak boleh melebihi 40 karakter!"});

        let foto_profil;
        if (req.file) {
          await new Promise((resolve, reject) => {
              ImgUpload.uploadToGcsSingle(username)(req, res, (err) => {
                  if (err) {
                      console.error(err.message);
                      return reject(res.status(500).json({
                          status: 500,
                          message: err.message
                      }));
                  }
                  resolve();
              });
          });

          foto_profil = req.file.cloudStoragePublicUrl;
        } else {
            const user = await pool.query("SELECT foto_profil FROM PENGGUNA WHERE username = $1", [oldUsername]);
            foto_profil = user.rows[0].foto_profil;
        }

        await pool.query("UPDATE PENGGUNA SET username = $1, nama = $2, tanggal_lahir = $3, alamat = $4, no_telepon = $5, no_rekening = $6, nama_bank = $7, foto_profil = $8", 
          [username, nama , tanggal_lahir, alamat, no_telepon, no_rekening, nama_bank, foto_profil]); 

        const jwtToken = jwtGenerator(username);

        return res.json({status: 200, message: "Berhasil mengubah data profile", token: jwtToken});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

module.exports = router;