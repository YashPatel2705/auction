// src/components/ManagePlayers.jsx

import { useState, useMemo } from 'react'
import { ROLES, ROLE_COLORS } from '../lib/constants'

const ROLE_LIST = ['Batter', 'Bowler', 'All-rounder', 'Wicket-keeper']

function EditPlayerModal({ player, onSave, onClose }) {
  const [name,   setName]   = useState(player.name)
  const [rating, setRating] = useState(player.rating)
  const [role,   setRole]   = useState(player.role)
  const [busy,   setBusy]   = useState(false)
  const [err,    setErr]    = useState('')

  const save = async () => {
    if (!name.trim()) return setErr('Name cannot be empty')
    if (rating < 1 || rating > 10) return setErr('Rating must be 1–10')
    setBusy(true)
    try {
      await onSave(player.id, { name, rating: Number(rating), role })
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={onClose}>
      <div className="slide-in" onClick={e => e.stopPropagation()}
        style={{ background: '#0a1e35', border: '1px solid #1e3a5f', borderRadius: 16, padding: 28, width: 380, maxWidth: '95%' }}>
        <div className="teko" style={{ fontSize: 22, color: '#fff', marginBottom: 20, letterSpacing: 1 }}>✏️ Edit Player</div>

        <label style={{ fontSize: 11, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 6 }}>NAME</label>
        <input value={name} onChange={e => setName(e.target.value)}
          style={{ width: '100%', background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 11, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 6 }}>ROLE</label>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ width: '100%', background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 12px', color: '#7ab4d8', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }}>
          {ROLE_LIST.map(r => <option key={r}>{r}</option>)}
        </select>

        <label style={{ fontSize: 11, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 6 }}>RATING (1–10)</label>
        <input type="number" min={1} max={10} value={rating} onChange={e => setRating(e.target.value)}
          style={{ width: '100%', background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

        {err && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>⚠ {err}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ background: '#1e3a5f', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#7ab4d8', fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={busy}
            style={{ background: 'linear-gradient(135deg,#00c864,#007a3d)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirm({ player, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    await onConfirm(player.id)
    onClose()
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={onClose}>
      <div className="slide-in" onClick={e => e.stopPropagation()}
        style={{ background: '#0a1e35', border: '1px solid #7f1d1d', borderRadius: 16, padding: 28, width: 360, maxWidth: '95%', textAlign: 'center' }}>
        <div style={{ fontSize: 38, marginBottom: 10 }}>🗑️</div>
        <div className="teko" style={{ fontSize: 22, color: '#fff', marginBottom: 8 }}>Delete Player?</div>
        <div style={{ color: '#7ab4d8', fontSize: 14, marginBottom: 22 }}>
          <strong style={{ color: '#fff' }}>{player.name}</strong> will be permanently removed from the auction.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onClose}
            style={{ background: '#1e3a5f', border: 'none', borderRadius: 8, padding: '10px 22px', color: '#7ab4d8', fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={go} disabled={busy}
            style={{ background: '#b91c1c', border: 'none', borderRadius: 8, padding: '10px 22px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {busy ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddPlayerModal({ onAdd, onClose }) {
  const [name,   setName]   = useState('')
  const [role,   setRole]   = useState('Batter')
  const [rating, setRating] = useState(5)
  const [busy,   setBusy]   = useState(false)
  const [err,    setErr]    = useState('')

  const save = async () => {
    if (!name.trim()) return setErr('Name cannot be empty')
    if (rating < 1 || rating > 10) return setErr('Rating must be 1–10')
    setBusy(true)
    try {
      await onAdd({ name, role, rating })
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={onClose}>
      <div className="slide-in" onClick={e => e.stopPropagation()}
        style={{ background: '#0a1e35', border: '1px solid #1e3a5f', borderRadius: 16, padding: 28, width: 380, maxWidth: '95%' }}>
        <div className="teko" style={{ fontSize: 22, color: '#fff', marginBottom: 20, letterSpacing: 1 }}>➕ Add New Player</div>

        <label style={{ fontSize: 11, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 6 }}>NAME</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Player name…"
          style={{ width: '100%', background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 11, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 6 }}>ROLE</label>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ width: '100%', background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 12px', color: '#7ab4d8', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }}>
          {ROLE_LIST.map(r => <option key={r}>{r}</option>)}
        </select>

        <label style={{ fontSize: 11, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 6 }}>RATING (1–10)</label>
        <input type="number" min={1} max={10} value={rating} onChange={e => setRating(e.target.value)}
          style={{ width: '100%', background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

        {err && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>⚠ {err}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ background: '#1e3a5f', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#7ab4d8', fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={busy}
            style={{ background: 'linear-gradient(135deg,#00c864,#007a3d)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {busy ? 'Adding…' : '➕ Add Player'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManagePlayers({ players, onUpdate, onDelete, onAdd, showToast }) {
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [editTarget, setEditTarget] = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [showAdd,    setShowAdd]    = useState(false)

  const filtered = useMemo(() =>
    players.filter(p => {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) &&
        (roleFilter === 'All' || p.role === roleFilter)
    }),
    [players, search, roleFilter]
  )

  const handleUpdate = async (id, fields) => {
    await onUpdate(id, fields)
    showToast('Player updated ✓')
  }

  const handleDelete = async (id) => {
    await onDelete(id)
    showToast('Player deleted')
  }

  const handleAdd = async (fields) => {
    await onAdd(fields)
    showToast('Player added ✓')
  }

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <input placeholder="🔍 Search player…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: '#0a1e35', border: '1px solid #1e3a5f', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ background: '#0a1e35', border: '1px solid #1e3a5f', borderRadius: 10, padding: '10px 14px', color: '#7ab4d8', fontSize: 13 }}>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <div style={{ color: '#4a7fa8', fontSize: 13 }}>{filtered.length} players</div>
        <button onClick={() => setShowAdd(true)}
          style={{ background: 'linear-gradient(135deg,#00c864,#007a3d)', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ➕ Add Player
        </button>
      </div>

      <div style={{ background: '#0a1e35', borderRadius: 14, border: '1px solid #1e3a5f', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 130px 80px 100px 90px', gap: 0, padding: '10px 16px', borderBottom: '1px solid #1e3a5f', background: '#08111e' }}>
          {['#', 'NAME', 'ROLE', 'RTG', 'STATUS', 'ACTIONS'].map(h => (
            <div key={h} style={{ fontSize: 10, color: '#3a6a8f', letterSpacing: 1.5, fontWeight: 700 }}>{h}</div>
          ))}
        </div>

        <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          {filtered.map((player, idx) => (
            <div key={player.id}
              style={{ display: 'grid', gridTemplateColumns: '40px 1fr 130px 80px 100px 90px', gap: 0, padding: '11px 16px', borderBottom: '1px solid #0d1e30', alignItems: 'center', transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#0d2040'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: 12, color: '#3a6a8f' }}>{player.id}</div>
              <div style={{ fontSize: 14, color: '#e8edf5', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{player.name}</div>
              <div>
                <span className="badge" style={{ background: ROLE_COLORS[player.role]?.bg, color: ROLE_COLORS[player.role]?.text, fontSize: 9 }}>
                  {player.role}
                </span>
              </div>
              <div className="teko" style={{ fontSize: 20, color: '#00c864' }}>{player.rating}</div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: player.status === 'sold' ? '#ffb060' : '#00c864' }}>
                  {player.status === 'sold' ? '● SOLD' : '● AVAIL'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setEditTarget(player)} title="Edit"
                  style={{ background: '#1e3a5f', border: 'none', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', color: '#7ab4d8', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✏️
                </button>
                <button onClick={() => setDelTarget(player)} title="Delete"
                  style={{ background: '#3a0d0d', border: 'none', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', color: '#f87171', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 50, color: '#3a6a8f' }}>No players match your filter</div>
          )}
        </div>
      </div>

      {editTarget && <EditPlayerModal player={editTarget} onSave={handleUpdate} onClose={() => setEditTarget(null)} />}
      {delTarget  && <DeleteConfirm  player={delTarget}  onConfirm={handleDelete} onClose={() => setDelTarget(null)} />}
      {showAdd    && <AddPlayerModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
    </div>
  )
}