import React, { useEffect, useState } from 'react';
import api from './apiClient';
import { rulesData } from './rulesData';

const BetchaApp = () => {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newCh, setNewCh] = useState({ title: '', description: '', stake: 10, rules: '', category: '' });
  const [view, setView] = useState('home');
  const [txnId, setTxnId] = useState(null);
  const [wallet, setWallet] = useState(0);

  useEffect(() => {
    const demo = { id: 'user_demo', name: 'Demo User' };
    setUser(demo);
    const fetch = async () => {
      try {
        const res = await api.get('/challenges');
        setChallenges(res.data.challenges || []);
        const wal = await api.get('/admin/wallets/' + demo.id).catch(() => ({}));
        if (wal && wal.data && wal.data.balance !== undefined) setWallet(wal.data.balance);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, []);

  const create = async () => {
    setLoading(true);
    try {
      const payload = { ...newCh, creatorId: user.id };
      const res = await api.post('/challenges/create', payload);
      setChallenges(prev => [res.data.challenge, ...prev]);
      setShowCreate(false);
      setNewCh({ title: '', description: '', stake: 10, rules: '', category: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const join = async (chId) => {
    try {
      await api.post('/challenges/join', { challengeId: chId, userId: user.id });
      const res = await api.get('/challenges');
      setChallenges(res.data.challenges || []);
    } catch (err) {
      console.error(err);
    }
  };

  const startDeposit = async (amount) => {
    try {
      const res = await api.post('/payments/create-payment-intent', { amount, userId: user.id });
      setTxnId(res.data.txnId);
      alert('Client secret: ' + res.data.clientSecret + '\nUse webhook-mark-complete to finalize in demo.');
    } catch (err) {
      console.error(err);
    }
  };

  const resolveDemo = async (challengeId, winnerId) => {
    try {
      await api.post('/admin/resolve', { challengeId, winnerId });
      const res = await api.get('/challenges');
      setChallenges(res.data.challenges || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Betcha — Fullstack Demo</h1>
        <div>
          <button onClick={() => setView('home')}>Home</button>
          <button onClick={() => setView('admin')}>Admin</button>
          <span style={{ marginLeft: 12 }}>Welcome, {user?.name} — Wallet: R{wallet}</span>
        </div>
      </header>

      {view === 'home' && (
        <section style={{ marginTop: 24 }}>
          <button onClick={() => setShowCreate(true)}>Create Challenge</button>
          <div style={{ marginTop: 12 }}>
            {challenges.map(c => (
              <div key={c.id} style={{ background: '#0b1220', padding: 12, marginBottom: 8, borderRadius: 8 }}>
                <h3>{c.title} — R{c.stake}</h3>
                <div style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1' }}>{c.rules}</div>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => join(c.id)}>Join</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <h3>Add funds (demo)</h3>
            <button onClick={() => startDeposit(100)}>Deposit R100 (demo)</button>
            <div style={{ marginTop: 8 }}>TxnId: {txnId}</div>
          </div>
        </section>
      )}

      {view === 'admin' && (
        <section style={{ marginTop: 24 }}>
          <h2>Admin — Challenges</h2>
          <div>
            {challenges.map(c => (
              <div key={c.id} style={{ background: '#071029', padding: 12, marginBottom: 8, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><strong>{c.title}</strong> — {c.status}</div>
                  <div>
                    <button onClick={() => resolveDemo(c.id, c.participants && c.participants[0])}>Resolve (pick 1st participant)</button>
                    <button onClick={() => alert('Open evidence list (not implemented in demo)')}>View Evidence</button>
                  </div>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1' }}>{c.rules}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#071029', padding: 20, borderRadius: 12, width: 600 }}>
            <h2>Create Challenge</h2>
            <input placeholder='Title' value={newCh.title} onChange={(e) => setNewCh({...newCh, title: e.target.value})} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <textarea placeholder='Description' value={newCh.description} onChange={(e) => setNewCh({...newCh, description: e.target.value})} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <select value={newCh.category} onChange={(e) => {
              const key = e.target.value;
              setNewCh({...newCh, category: key, rules: rulesData[key]?.rules.join('\n') || ''});
            }} style={{ width: '100%', padding: 8, marginBottom: 8 }}>
              <option value=''>Select Game</option>
              {Object.keys(rulesData).map(k => <option key={k} value={k}>{rulesData[k].title}</option>)}
            </select>
            <input type='number' value={newCh.stake} onChange={(e) => setNewCh({...newCh, stake: e.target.value})} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <textarea value={newCh.rules} onChange={(e) => setNewCh({...newCh, rules: e.target.value})} rows={6} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCreate(false)}>Cancel</button>
              <button onClick={create} disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
);
export default BetchaApp;
