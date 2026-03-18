// src/components/ManageTeams.jsx

import { useState } from 'react'

const PRESET_COLORS = [
  '#004BA0','#D4AC0D','#C8102E','#3A225D','#0078BC',
  '#FF822A','#AA4545','#EA1A85','#1A6B3C','#E65C00',
  '#6A0DAD','#00897B','#1565C0','#AD1457','#2E7D32',
]

// Auto-generate a unique ID — short name + random suffix to avoid clashes
function generateId(short) {
  const base    = short.toUpperCase().trim().slice(0, 4)
  const suffix  = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${base}_${suffix}`
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
        {PRESET_COLORS.map(c => (
          <button key={c} onClick={() => onChange(c)}
            style={{ width: 28, height: 28, borderRadius: 6, background: c, border: value === c ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 36, height: 36, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
        <span style={{ fontSize: 12, color: '#4a7fa8' }}>Custom color: {value}</span>
      </div>
    </div>
  )
}

function TeamModal({ team, onSave, onClose }) {
  const isEdit = !!team
  const [name,   setName]   = useState(team?.name   || '')
  const [short,  setShort]  = useState(team?.short  || '')
  const [color,  setColor]  = useState(team?.color  || '#004BA0')
  const [accent, setAccent] = useState(team?.accent || '#FFFFFF')
  const [busy,   setBusy]   = useState(false)
  const [err,    setErr]    = useState('')

  const save = async () => {
    if (!name.trim())  return setErr('Team name cannot be empty')
    if (!short.trim()) return setErr('Short name cannot be empty')
    setBusy(true)
    try {
      // For new teams, auto-generate a unique ID — no manual input needed
      const id = isEdit ? team.id : generateId(short)
      await onSave({ id, name, short, color, accent })
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={onClose}>
      <div className="slide-in" onClick={e => e.stopPropagation()}
        style={{ background: '#0a1e35', border: '1px solid #1e3a5f', borderRadius: 16, padding: 28, width: 420, maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="teko" style={{ fontSize: 22, color: '#fff', marginBottom: 20, letterSpacing: 1 }}>
          {isEdit ? '✏️ Edit Team' : '➕ Add Team'}
        </div>

        <label style={{ fontSize: 11, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 6 }}>FULL TEAM NAME</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Gujarat Titans"
          style={{ width: '100%', background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 11, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 6 }}>SHORT NAME (2–4 letters)</label>
        <input value={short} onChange={e => setShort(e.target.value.toUpperCase())} placeholder="GT" maxLength={5}
          style={{ width: '100%', background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 11, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 8 }}>TEAM COLOR</label>
        <ColorPicker value={color} onChange={setColor} />

        <label style={{ fontSize: 11, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 8 }}>ACCENT / TEXT COLOR</label>
        <ColorPicker value={accent} onChange={setAccent} />

        {/* Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#08111e', borderRadius: 10, padding: '12px 16px', marginBottom: 18, border: '1px solid #1e3a5f' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: accent, fontWeight: 800, flexShrink: 0 }}>
            {short || '??'}
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#4a7fa8', marginBottom: 2 }}>PREVIEW</div>
            <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>{name || 'Team Name'}</div>
          </div>
        </div>

        {err && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>⚠ {err}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ background: '#1e3a5f', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#7ab4d8', fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={busy}
            style={{ background: 'linear-gradient(135deg,#00c864,#007a3d)', border: 'none', borderRadius: 8, padding: '10px 22px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Team'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteTeamConfirm({ team, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState('')
  const go = async () => {
    setBusy(true)
    setErr('')
    try {
      await onConfirm(team.id)
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={onClose}>
      <div className="slide-in" onClick={e => e.stopPropagation()}
        style={{ background: '#0a1e35', border: '1px solid #7f1d1d', borderRadius: 16, padding: 28, width: 360, maxWidth: '95%', textAlign: 'center' }}>
        <div style={{ fontSize: 38, marginBottom: 10 }}>🗑️</div>
        <div className="teko" style={{ fontSize: 22, color: '#fff', marginBottom: 8 }}>Delete Team?</div>
        <div style={{ color: '#7ab4d8', fontSize: 14, marginBottom: 22, lineHeight: 1.6 }}>
          <strong style={{ color: '#fff' }}>{team.name}</strong> will be permanently deleted.
          All players assigned to this team will be returned to the player pool.
        </div>
        {err && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>⚠ {err}</div>}
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

export default function ManageTeams({ teams, onAdd, onUpdate, onDelete, showToast }) {
  const [editTarget, setEditTarget] = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [showAdd,    setShowAdd]    = useState(false)

  const handleAdd = async (fields) => {
    await onAdd(fields)
    showToast(`${fields.name} added ✓`)
  }

  const handleUpdate = async (fields) => {
    await onUpdate(editTarget.id, fields)
    showToast(`${fields.name} updated ✓`)
  }

  const handleDelete = async (id) => {
    await onDelete(id)
    showToast('Team deleted')
  }

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: '#4a7fa8', fontSize: 14 }}>{teams.length} teams registered</div>
        <button onClick={() => setShowAdd(true)}
          style={{ background: 'linear-gradient(135deg,#00c864,#007a3d)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ➕ Add Team
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
        {teams.map(team => (
          <div key={team.id}
            style={{ background: '#0a1e35', border: '1px solid #1e3a5f', borderLeft: `4px solid ${team.color}`, borderRadius: 14, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: team.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: team.accent, fontWeight: 800, flexShrink: 0 }}>
              {team.short}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
              <div style={{ fontSize: 11, color: '#4a7fa8', marginTop: 3 }}>{team.short}</div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
              <button onClick={() => setEditTarget(team)} title="Edit"
                style={{ background: '#1e3a5f', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: '#7ab4d8', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✏️
              </button>
              <button onClick={() => setDelTarget(team)} title="Delete"
                style={{ background: '#3a0d0d', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: '#f87171', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🗑️
              </button>
            </div>
          </div>
        ))}

        {teams.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#3a6a8f' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏏</div>
            <div>No teams yet — add one above</div>
          </div>
        )}
      </div>

      {showAdd    && <TeamModal team={null}       onSave={handleAdd}    onClose={() => setShowAdd(false)} />}
      {editTarget && <TeamModal team={editTarget} onSave={handleUpdate} onClose={() => setEditTarget(null)} />}
      {delTarget  && <DeleteTeamConfirm team={delTarget} onConfirm={handleDelete} onClose={() => setDelTarget(null)} />}
    </div>
  )
}