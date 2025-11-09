const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

router.post('/resolve', async (req, res) => {
  const { challengeId, winnerId } = req.body;
  if (!challengeId || !winnerId) return res.status(400).json({ error: 'challengeId and winnerId required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const chRes = await client.query('SELECT * FROM challenges WHERE id = $1 FOR UPDATE', [challengeId]);
    if (chRes.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Challenge not found' }); }
    const challenge = chRes.rows[0];
    if (challenge.status === 'completed') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Already completed' }); }

    const totalPot = Number(challenge.stake) * (challenge.participants.length || 2);
    const house = totalPot * 0.10;
    const winnerPayout = totalPot - house;

    const txnId = 'txn_' + uuidv4();
    await client.query("INSERT INTO transactions(id, user_id, type, amount, status, metadata) VALUES($1,$2,$3,$4,$5,$6)", 
      [txnId, winnerId, 'payout', winnerPayout, 'completed', JSON.stringify({ challengeId })]);

    const wal = await client.query('SELECT * FROM wallets WHERE user_id = $1', [winnerId]);
    if (wal.rowCount === 0) {
      await client.query('INSERT INTO wallets(user_id, balance) VALUES($1,$2)', [winnerId, winnerPayout]);
    } else {
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [winnerPayout, winnerId]);
    }

    await client.query('UPDATE challenges SET status = $1, winner_id = $2, winner_payout = $3 WHERE id = $4', ['completed', winnerId, winnerPayout, challengeId]);

    await client.query('COMMIT');
    res.json({ ok: true, winnerPayout });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/wallets/:userId', async (req, res) => {
  const userId = req.params.userId;
  const w = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
  if (w.rowCount === 0) return res.json({ balance: 0 });
  res.json({ balance: Number(w.rows[0].balance) });
});

module.exports = router;
