require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { runMigrations } = require('./db');

const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const paymentsRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const app = express();
app.use(cors());
app.use(bodyParser.json());

(async () => { await runMigrations(); })();

app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => res.json({ ok: true, msg: 'Betcha backend running' }));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Backend listening on ${port}`));
