const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

router.post('/register', async (req, res) => {
  try {
    const { phone, password, name, email } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'phone and password required' });
    const exists = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (exists.rowCount > 0) return res.status(400).json({ error: 'User exists' });

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await pool.query('INSERT INTO users(id, phone, email, name, password_hash) VALUES($1,$2,$3,$4,$5)', [id, phone, email || null, name || null, hash]);
    await pool.query('INSERT INTO wallets(user_id, balance) VALUES($1,$2)', [id, 0]);

    const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: '14d' });
    res.json({ token, user: { id, phone, name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const u = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (u.rowCount === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const user = u.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '14d' });
    res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Missing token' });
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    const u = await pool.query('SELECT id, phone, name, email FROM users WHERE id = $1', [payload.id]);
    if (u.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json(u.rows[0]);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
