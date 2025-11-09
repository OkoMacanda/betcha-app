const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

if (!require('fs').existsSync(uploadDir)) require('fs').mkdirSync(uploadDir, { recursive: true });

router.post('/evidence', upload.single('file'), async (req, res) => {
  try {
    const { challengeId, userId, note } = req.body;
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const id = 'evi_' + uuidv4();
    await pool.query('INSERT INTO transactions(id, user_id, type, amount, status, metadata) VALUES($1,$2,$3,$4,$5,$6)',
      [id, userId, 'evidence', 0, 'completed', JSON.stringify({ challengeId, path: req.file.filename, note })]);
    res.json({ ok: true, file: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
