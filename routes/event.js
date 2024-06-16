const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const ImgUpload = require("../middleware/imgUpload");
const { predictNSFWClassification, predictWasteClassification } = require('../middleware/inferenceService');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1 * 1024 * 1024 } // 1 MB file size limit
}).array('file_foto', 3);

const documentation = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1 * 1024 * 1024 } // 1 MB file size limit
}).array('foto_dokumentasi', 2);

router.get("", async (req, res) => {
    try {
        let query = "SELECT id_event, judul_event, foto_lokasi[1], deskripsi, username AS pembuat_event FROM event WHERE status = 'false' ORDER BY level DESC";
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
            const { modelNSFW, modelWaste } = req.app;
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
            ) || !req.files || req.files.length === 0) {
                return res.status(400).json({
                    status: 400,
                    message: "Terdapat field yang kosong"
                });
            }

            let query = "SELECT COUNT(*) as jumlah_event FROM event WHERE id_event LIKE $1";
            let jumlah_event = (await pool.query(query, [`${tipe_lokasi.toUpperCase()}%`])).rows[0].jumlah_event;
            let id_event = `${tipe_lokasi.toUpperCase()}-${(parseInt(jumlah_event) + 1).toString().padStart(3, '0')}`;
            let avgScore;

            // Check if the uploaded photos have NSFW content
            if (req.files || req.files.length >= 0) {
                try {
                    let isNotSafe, indexNotSafe, msg, sum = 0;
                    for (let index = 0; index < req.files.length; index++) {
                        const file = req.files[index];
                        const { label, explanation } = await predictNSFWClassification(modelNSFW, new Uint8Array(file.buffer));
                        
                        // Handle if not safe
                        if (label !== 'safe') {
                            isNotSafe = true;
                            indexNotSafe = index;
                            msg = explanation;
                            break; // Exit loop early if an unsafe label is found
                        } else {
                            sum += (await predictWasteClassification(modelWaste, new Uint8Array(file.buffer))).confidenceScore;
                        }
                    }
                    if (req.files.length > 0) {
                        avgScore = (sum / req.files.length).toFixed(2);
                    }

                    if (isNotSafe) {
                        return res.status(400).json({ status: 400, message: `Gambar ke-${indexNotSafe + 1} ${msg}` })
                    }
                } catch (err) {
                    console.error(err.message);
                    return res.status(500).json({ status: 500, message: err.message });
                }
            }

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
                const query = "INSERT INTO EVENT VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)";
                await pool.query(query, [id_event, judul_event, foto_lokasi, alamat, deskripsi, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, jumlah_minimum_volunteer, 
                                        jumlah_minimum_donasi, username, avgScore]);
            
                // Return success response
                return res.status(201).json({
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


router.post("/join", async (req, res) => {
    try {
        const { id_event } = req.body;
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(' ')[1];
        let verify = jwt.verify(token, process.env.jwtSecret);
        let username = verify.user.username;

        await pool.query("INSERT INTO PENGGUNA_EVENT(username, id_event) VALUES($1,$2)", [username, id_event]);

        return res.status(201).json({status: 201, message: "Berhasil gabung ke dalam event!"});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

router.post("/donate", async (req, res) => {
    try {
        const { tanggal, nominal, id_event } = req.body;
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(' ')[1];
        let verify = jwt.verify(token, process.env.jwtSecret);
        let username = verify.user.username;

        let query = "SELECT COUNT(*) as jumlah_donasi FROM donasi";
        jumlah_donasi = (await pool.query(query)).rows[0].jumlah_donasi;
        let id_donasi = `DONASI-${(parseInt(jumlah_donasi)+1).toString().padStart(3, '0')}`;

        await pool.query("INSERT INTO DONASI(id_donasi, tanggal, nominal, username, id_event) VALUES($1,$2,$3,$4,$5)", [id_donasi, tanggal, nominal, username, id_event]);

        return res.status(201).json({status: 201, message: `Berhasil donasi ke event dengan ID ${id_event}!`});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

router.get("/list", async (req, res) => {
    try {
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(' ')[1];
        let verify = jwt.verify(token, process.env.jwtSecret);
        let username = verify.user.username;

        query = await pool.query("SELECT * FROM PENGGUNA_EVENT WHERE username=$1 ", [username]);

        return res.status(201).json({status: 200, listEvent: query.rows});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

router.get("/donate/list", async (req, res) => {
    try {
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(' ')[1];
        let verify = jwt.verify(token, process.env.jwtSecret);
        let username = verify.user.username;

        query = await pool.query("SELECT * FROM donasi WHERE username=$1 ", [username]);

        return res.json({status: 200, listDonasi: query.rows});
  
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({status: 500, message: err.message});
    }
});

router.post("/laporan/create", async (req, res) => {
    documentation(req, res, async (err) => {
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
            let { id_event, kendala, jumlah_volunteer } = req.body;
            let modelWaste = req.app.modelWaste;
            const authHeader = req.header("Authorization");
            const token = authHeader && authHeader.split(' ')[1];
            let verify = jwt.verify(token, process.env.jwtSecret);
            let username = verify.user.username;

            const areAllVariablesDefined = (...vars) => vars.every(v => v !== undefined && v !== null);

            if (!areAllVariablesDefined(id_event, jumlah_volunteer, req.files) || req.files.length === 0) {
                return res.status(400).json({
                    status: 400,
                    message: "Terdapat field yang kosong"
                });
            }

            if (req.files || req.files.length >= 0) {
                try {
                    let isNotClean, indexNotClean;
                    for (let index = 0; index < req.files.length; index++) {
                        const file = req.files[index];
                        const { result } = await predictWasteClassification(modelWaste, new Uint8Array(file.buffer));
                        if (result === 'kotor') {
                            isNotClean = true;
                            indexNotClean = index;
                            break; // Exit loop early if an unclean label is found
                        }
                        
                    }
                    if (isNotClean) {
                        return res.status(400).json({ status: 400, message: `Gambar ke-${indexNotClean + 1} terdeteksi masih kotor, laporan tidak dapat dibuat` })
                    }
                } catch (err) {
                    console.error(err.message);
                    return res.status(500).json({ status: 500, message: err.message });
                }
            }

            let query = "SELECT COUNT(*) as jumlah_laporan FROM laporan";
            jumlah_laporan = (await pool.query(query)).rows[0].jumlah_laporan;
            let id_laporan = `LAPORAN-${(parseInt(jumlah_laporan)+1).toString().padStart(3, '0')}`;

            ImgUpload.uploadToGcsDocumentation(id_event)(req, res, async (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({
                        status: 500,
                        message: err.message
                    });
                }
            
                // Get the file URL and push it to the array
                const foto_dokumentasi = req.files.map(file => file.cloudStoragePublicUrl);

                // Update status event
                let query = "UPDATE event SET status = 'true' WHERE id_event = $1";
                await pool.query(query, [id_event]);
            
                // Insert the laporan into the database
                if (kendala) {
                    const query = "INSERT INTO LAPORAN VALUES ($1, $2, $3, $4, $5, $6)";
                    await pool.query(query, [id_laporan, kendala, jumlah_volunteer, username, id_event, foto_dokumentasi]);
                } else {
                    const query = "INSERT INTO LAPORAN (id_laporan, jumlah_volunteer, username, id_event, foto_dokumentasi) VALUES ($1, $2, $3, $4, $5)";
                    await pool.query(query, [id_laporan, jumlah_volunteer, username, id_event, foto_dokumentasi]);
                }
            
                // Return success response
                return res.status(201).json({
                    status: 201,
                    message: "Laporan berhasil dibuat"
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