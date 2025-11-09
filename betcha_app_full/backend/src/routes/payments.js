const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET || '');

router.post('/create-payment-intent', async (req, res, next) => {
  try {
    const { amount, userId } = req.body;
    if (!amount || !userId) return res.status(400).json({ error: 'amount and userId required' });
    const txnId = 'txn_' + uuidv4();
    await pool.query('INSERT INTO transactions(id, user_id, type, amount, status, metadata) VALUES($1,$2,$3,$4,$5,$6)',
      [txnId, userId, 'deposit', Number(amount), 'pending', JSON.stringify({})]);

    if (process.env.STRIPE_SECRET) {
      const pi = await stripe.paymentIntents.create({ amount: Math.round(Number(amount) * 100), currency: 'zar', metadata: { txnId } });
      res.json({ clientSecret: pi.client_secret, txnId });
    } else {
      res.json({ clientSecret: 'pi_demo_' + txnId, txnId });
    }
  } catch (err) { next(err); }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    if (process.env.STRIPE_SECRET && process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const txnId = pi.metadata && pi.metadata.txnId;
    if (txnId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const t = await client.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [txnId]);
        if (t.rowCount === 1) {
          const trx = t.rows[0];
          await client.query('UPDATE transactions SET status = $1 WHERE id = $2', ['completed', txnId]);
          const wal = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [trx.user_id]);
          if (wal.rowCount === 0) {
            await client.query('INSERT INTO wallets(user_id, balance) VALUES($1,$2)', [trx.user_id, Number(trx.amount)]);
          } else {
            await client.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [Number(trx.amount), trx.user_id]);
          }
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
      } finally {
        client.release();
      }
    }
  }

  res.json({ received: true });
});

router.post('/webhook-mark-complete', express.json(), async (req, res) => {
  const { txnId } = req.body;
  if (!txnId) return res.status(400).json({ error: 'txnId required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const t = await client.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [txnId]);
    if (t.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Transaction not found' }); }
    const trx = t.rows[0];
    await client.query('UPDATE transactions SET status = $1 WHERE id = $2', ['completed', txnId]);
    const wal = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [trx.user_id]);
    if (wal.rowCount === 0) {
      await client.query('INSERT INTO wallets(user_id, balance) VALUES($1,$2)', [trx.user_id, Number(trx.amount)]);
    } else {
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [Number(trx.amount), trx.user_id]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
