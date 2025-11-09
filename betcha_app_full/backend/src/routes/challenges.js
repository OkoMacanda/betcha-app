const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM challenges ORDER BY created_at DESC LIMIT 100');
  res.json({ challenges: result.rows });
});

router.post('/create', async (req, res) => {
  const { title, description, rules, stake, creatorId, category } = req.body;
  if (!title || !stake || !creatorId) return res.status(400).json({ error: 'Missing fields' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const chId = 'ch_' + uuidv4();
    await client.query('INSERT INTO challenges(id, title, description, rules, stake, creator_id, participants, category) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [chId, title, description, rules, stake, creatorId, [creatorId], category]);
    const txnId = 'txn_' + uuidv4();
    await client.query('INSERT INTO transactions(id, user_id, type, amount, status, metadata) VALUES($1,$2,$3,$4,$5,$6)',
      [txnId, creatorId, 'challenge_create', -Math.abs(Number(stake)), 'escrowed', JSON.stringify({ challengeId: chId })]);
    await client.query('INSERT INTO wallets(user_id, balance) VALUES($1,$2) ON CONFLICT (user_id) DO NOTHING', [creatorId, 0]);
    await client.query('COMMIT');
    const chRes = await pool.query('SELECT * FROM challenges WHERE id = $1', [chId]);
    res.json({ challenge: chRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/join', async (req, res) => {
  const { challengeId, userId } = req.body;
  if (!challengeId || !userId) return res.status(400).json({ error: 'challengeId and userId required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const chRes = await client.query('SELECT * FROM challenges WHERE id = $1 FOR UPDATE', [challengeId]);
    if (chRes.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Challenge not found' }); }
    const challenge = chRes.rows[0];
    if ((challenge.participants || []).includes(userId)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Already joined' }); }
    const newParts = (challenge.participants || []).concat([userId]);
    await client.query('UPDATE challenges SET participants = $1, status = $2 WHERE id = $3', [newParts, 'active', challengeId]);
    const txnId = 'txn_' + uuidv4();
    await client.query('INSERT INTO transactions(id, user_id, type, amount, status, metadata) VALUES($1,$2,$3,$4,$5,$6)',
      [txnId, userId, 'challenge_join', -Math.abs(Number(challenge.stake)), 'escrowed', JSON.stringify({ challengeId })]);
    await client.query('INSERT INTO wallets(user_id, balance) VALUES($1,$2) ON CONFLICT (user_id) DO NOTHING', [userId, 0]);
    await client.query('COMMIT');
    const updated = await pool.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
    res.json({ challenge: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/my/:userId', async (req, res) => {
  const userId = req.params.userId;
  const result = await pool.query('SELECT * FROM challenges WHERE $1 = ANY(participants) OR creator_id = $1', [userId]);
  res.json({ challenges: result.rows });
});

module.exports = router;
