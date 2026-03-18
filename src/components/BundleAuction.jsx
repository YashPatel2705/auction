// src/components/BundleAuction.jsx

import { useState, useMemo } from 'react'
import { ROLE_COLORS } from '../lib/constants'

function PlayerChip({ player, onRemove }) {
  return (
    <span style={{
      display:'flex', alignItems:'center', gap:6,
      background:'#08111e', border:'1px solid #1e3a5f',
      borderRadius:8, padding:'4px 10px', fontSize:12, color:'#d0e0f0', fontWeight:600,
    }}>
      <span style={{ background:ROLE_COLORS[player.role]?.bg, color:ROLE_COLORS[player.role]?.text, borderRadius:4, padding:'1px 6px', fontSize:9, fontWeight:800 }}>
        {player.role.slice(0,3).toUpperCase()}
      </span>
      {player.name}
      {onRemove && (
        <button onClick={() => onRemove(player.id)}
          style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:14, padding:0, lineHeight:1, marginLeft:2 }}>
          ×
        </button>
      )}
    </span>
  )
}

function BundleModal({ bundle, players, bundles, onSave, onClose }) {
  const isEdit = !!bundle
  const existingPlayers = isEdit ? players.filter(p => bundle.playerIds.includes(p.id)) : []

  const [name,     setName]     = useState(bundle?.name || '')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(existingPlayers)
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState('')

  // IDs already taken by OTHER bundles (not this one)
  const takenIds = new Set(
    (bundles || [])
      .filter(b => b.status !== 'sold' && b.id !== bundle?.id)
      .flatMap(b => b.playerIds)
  )

  // Available = available players not in other bundles, OR already in this bundle (for edit)
  const available = players.filter(p =>
    (p.status === 'available' || bundle?.playerIds.includes(p.id)) &&
    !takenIds.has(p.id)
  )

  const filtered = useMemo(() =>
    available.filter(p =>
      !selected.find(s => s.id === p.id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    ), [available, selected, search])

  const addPlayer    = (p)  => setSelected(prev => [...prev, p])
  const removePlayer = (id) => setSelected(prev => prev.filter(p => p.id !== id))

  const save = async () => {
    if (!name.trim())        return setErr('Bundle name cannot be empty')
    if (selected.length < 1) return setErr('Select at least 1 player')
    setBusy(true)
    try {
      if (isEdit) {
        await onSave({ bundleId: bundle.id, name, playerIds: selected.map(p => p.id) })
      } else {
        await onSave({ name, playerIds: selected.map(p => p.id) })
      }
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000 }}
      onClick={onClose}>
      <div className="slide-in" onClick={e => e.stopPropagation()}
        style={{ background:'#0a1e35', border:'1px solid #1e3a5f', borderRadius:16, padding:28, width:520, maxWidth:'96%', maxHeight:'90vh', overflowY:'auto' }}>

        <div className="teko" style={{ fontSize:22, color:'#fff', marginBottom:18, letterSpacing:1 }}>
          {isEdit ? '✏️ Edit Bundle' : '📦 Create Bundle'}
        </div>

        <label style={{ fontSize:11, color:'#4a7fa8', letterSpacing:1, display:'block', marginBottom:6 }}>BUNDLE NAME</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Power Hitters Pack"
          style={{ width:'100%', background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'10px 12px', color:'#fff', fontSize:14, marginBottom:16, boxSizing:'border-box' }} />

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:'#4a7fa8', letterSpacing:1, marginBottom:8 }}>SELECTED PLAYERS ({selected.length})</div>
          {selected.length === 0 ? (
            <div style={{ fontSize:12, color:'#2a4a6f', fontWeight:600 }}>No players selected yet</div>
          ) : (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {selected.map(p => <PlayerChip key={p.id} player={p} onRemove={removePlayer} />)}
            </div>
          )}
        </div>

        <div style={{ fontSize:11, color:'#4a7fa8', letterSpacing:1, marginBottom:8 }}>ADD PLAYERS</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search available players…"
          style={{ width:'100%', background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'9px 12px', color:'#fff', fontSize:13, marginBottom:8, boxSizing:'border-box' }} />

        <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:4, marginBottom:18 }}>
          {filtered.length === 0 && (
            <div style={{ fontSize:12, color:'#2a4a6f', padding:'10px 0', fontWeight:600 }}>No available players found</div>
          )}
          {filtered.map(p => (
            <button key={p.id} onClick={() => addPlayer(p)}
              style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', transition:'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='#00c864'}
              onMouseLeave={e => e.currentTarget.style.borderColor='#1e3a5f'}>
              <span style={{ background:ROLE_COLORS[p.role]?.bg, color:ROLE_COLORS[p.role]?.text, borderRadius:4, padding:'1px 6px', fontSize:9, fontWeight:800 }}>
                {p.role.slice(0,3).toUpperCase()}
              </span>
              <span style={{ fontSize:13, color:'#d0e0f0', fontWeight:600, flex:1, textAlign:'left' }}>{p.name}</span>
              <span style={{ fontSize:11, color:'#00c864', fontWeight:700 }}>+ Add</span>
            </button>
          ))}
        </div>

        {err && <div style={{ color:'#ef4444', fontSize:12, marginBottom:12 }}>⚠ {err}</div>}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose}
            style={{ background:'#1e3a5f', border:'none', borderRadius:8, padding:'10px 20px', color:'#7ab4d8', fontSize:14, cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={busy}
            style={{ background:'linear-gradient(135deg,#00c864,#007a3d)', border:'none', borderRadius:8, padding:'10px 22px', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            {busy ? 'Saving…' : isEdit ? '✏️ Save Changes' : '📦 Create Bundle'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BundleAuctionStage({ bundle, players, teams, onSell, onCancel, showToast }) {
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [bid,          setBid]          = useState('')
  const [busy,         setBusy]         = useState(false)

  const bundlePlayers = players.filter(p => bundle.playerIds.includes(p.id))
  const team          = teams.find(t => t.id === selectedTeam)

  const handleSell = async () => {
    const points = Number(bid)
    if (!selectedTeam)      return showToast('Select a team first', 'error')
    if (!bid || points < 1) return showToast('Enter a valid bid amount', 'error')
    if (points > (team?.points ?? 0)) {
      return showToast(`${team?.name} only has ${(team?.points ?? 0).toLocaleString()} points!`, 'error')
    }
    setBusy(true)
    try {
      await onSell({ bundleId: bundle.id, teamId: selectedTeam, points, playerIds: bundle.playerIds })
      showToast(`Bundle "${bundle.name}" sold to ${team?.name} for ${points.toLocaleString()} points!`)
      // DO NOT call onCancel here — it would reset bundle status back to 'available'
      // Realtime subscription handles closing the stage by updating status to 'sold'
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="slide-in" style={{ background:'linear-gradient(160deg,#0a1e35,#0c2448)', borderRadius:16, border:'2px solid #00c86444', overflow:'hidden', marginBottom:20 }}>
      <div style={{ padding:'13px 18px', borderBottom:'1px solid #1e3a5f', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>📦</span>
          <span className="teko" style={{ fontSize:20, letterSpacing:1.5, color:'#00c864' }}>BUNDLE ON AUCTION</span>
        </div>
        <button onClick={onCancel} style={{ background:'none', border:'1px solid #1e3a5f', borderRadius:6, padding:'4px 12px', color:'#6a9abf', fontSize:12, fontWeight:700, cursor:'pointer' }}>
          ✕ Cancel
        </button>
      </div>

      <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <div className="teko" style={{ fontSize:24, color:'#fff', marginBottom:4 }}>{bundle.name}</div>
          <div style={{ fontSize:12, color:'#5a8fba', marginBottom:14, fontWeight:600 }}>{bundlePlayers.length} players in this bundle</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {bundlePlayers.map(p => (
              <div key={p.id} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ background:ROLE_COLORS[p.role]?.bg, color:ROLE_COLORS[p.role]?.text, borderRadius:4, padding:'1px 6px', fontSize:9, fontWeight:800 }}>
                  {p.role.slice(0,3).toUpperCase()}
                </span>
                <span style={{ fontSize:13, color:'#d0e0f0', fontWeight:700 }}>{p.name}</span>
                <span className="teko" style={{ marginLeft:'auto', fontSize:18, color:'#00c864' }}>{p.rating}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:10, color:'#5a8fba', letterSpacing:1.5, fontWeight:700, marginBottom:10 }}>SELECT TEAM & BID</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14, maxHeight:200, overflowY:'auto' }}>
            {teams.map(t => {
              const active = selectedTeam === t.id
              return (
                <button key={t.id} onClick={() => setSelectedTeam(active ? null : t.id)}
                  style={{ background: active ? t.color+'22' : '#08111e', border:`2px solid ${active ? t.color : '#1e3a5f'}`, borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:t.color, flexShrink:0 }} />
                  <span style={{ fontSize:12, color: active ? '#fff' : '#7ab4d8', fontWeight:700, flex:1, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</span>
                  <span style={{ fontSize:11, color: t.points < 1000 ? '#ef4444' : '#5a8fba', fontWeight:700, flexShrink:0 }}>
                    {t.points.toLocaleString()} pts
                  </span>
                </button>
              )
            })}
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:'#4a7fa8', letterSpacing:1, display:'block', marginBottom:6 }}>BID POINTS</label>
            <input type="number" min={1} max={team?.points ?? 100000} value={bid}
              onChange={e => setBid(e.target.value)} placeholder="e.g. 5000"
              style={{ width:'100%', background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'10px 12px', color:'#fff', fontSize:16, fontWeight:700, boxSizing:'border-box' }} />
            {team && (
              <div style={{ fontSize:11, color: Number(bid) > team.points ? '#ef4444' : '#5a8fba', marginTop:5, fontWeight:600 }}>
                {team.name} has {team.points.toLocaleString()} pts remaining
                {Number(bid) > team.points && ' — not enough!'}
              </div>
            )}
          </div>

          <button onClick={handleSell} disabled={!selectedTeam || !bid || busy}
            style={{ width:'100%', background: selectedTeam && bid && !busy ? 'linear-gradient(135deg,#00c864,#007a3d)' : '#1e3a5f', border:'none', borderRadius:10, padding:14, color:'#fff', fontSize:17, fontFamily:"'Teko',sans-serif", letterSpacing:2, cursor: selectedTeam && bid && !busy ? 'pointer' : 'not-allowed' }}>
            {busy ? '⏳ Saving…' : '⚡ CONFIRM BUNDLE SOLD'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BundleAuction({ players, teams, bundles, onCreate, onUpdate, onDelete, onActivate, onDeactivate, onSell, onRefund, showToast }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [refundBusy, setRefundBusy] = useState(null)

  const activeBundle     = bundles.find(b => b.status === 'active')
  const availableBundles = bundles.filter(b => b.status === 'available')
  const soldBundles      = bundles.filter(b => b.status === 'sold')

  const handleCreate = async (fields) => {
    try {
      await onCreate(fields)
      showToast(`Bundle "${fields.name}" created ✓`)
      setShowCreate(false)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleUpdate = async (fields) => {
    try {
      await onUpdate(fields)
      showToast(`Bundle "${fields.name}" updated ✓`)
      setEditTarget(null)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (bundle) => {
    if (!window.confirm(`Delete bundle "${bundle.name}"?`)) return
    try {
      await onDelete(bundle.id)
      showToast('Bundle deleted')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleActivate = async (bundle) => {
    try {
      await onActivate(bundle.id)
      showToast(`"${bundle.name}" is now on the auction block!`)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDeactivate = async () => {
    if (!activeBundle) return
    try { await onDeactivate(activeBundle.id) }
    catch (err) { showToast(err.message, 'error') }
  }

  const handleRefund = async (bundle) => {
    const soldTeam = teams.find(t => t.id === bundle.soldTo)
    if (!window.confirm(
      `Refund bundle "${bundle.name}"?\n\n` +
      `• All ${bundle.playerIds.length} players returned to pool\n` +
      `• ${bundle.soldPoints?.toLocaleString()} points refunded to ${soldTeam?.name}\n` +
      `• Bundle reset to available`
    )) return
    setRefundBusy(bundle.id)
    try {
      await onRefund({ bundleId: bundle.id, teamId: bundle.soldTo, soldPoints: bundle.soldPoints, playerIds: bundle.playerIds })
      showToast(`Bundle "${bundle.name}" refunded — ${bundle.soldPoints?.toLocaleString()} pts returned to ${soldTeam?.name}`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setRefundBusy(null)
    }
  }

  return (
    <div className="fade-up">

      {activeBundle && (
        <BundleAuctionStage
          bundle={activeBundle}
          players={players}
          teams={teams}
          onSell={onSell}
          onCancel={handleDeactivate}
          showToast={showToast}
        />
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div className="teko" style={{ fontSize:22, letterSpacing:1, color:'#fff' }}>PLAYER BUNDLES</div>
          <div style={{ fontSize:12, color:'#4a7fa8', fontWeight:600 }}>{availableBundles.length} available · {soldBundles.length} sold</div>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ background:'linear-gradient(135deg,#00c864,#007a3d)', border:'none', borderRadius:10, padding:'10px 20px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          📦 Create Bundle
        </button>
      </div>

      {/* Team points overview */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8, marginBottom:20 }}>
        {teams.map(t => (
          <div key={t.id} style={{ background:'#0a1e35', border:`1px solid ${t.color}44`, borderLeft:`3px solid ${t.color}`, borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:7, background:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:t.accent, fontWeight:800, flexShrink:0 }}>
              {t.short}
            </div>
            <div>
              <div style={{ fontSize:12, color:'#fff', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:100 }}>{t.name}</div>
              <div className="teko" style={{ fontSize:16, color: t.points < 5000 ? '#ef4444' : '#00c864', lineHeight:1 }}>
                {t.points.toLocaleString()} <span style={{ fontSize:10, color:'#5a8fba' }}>pts</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {availableBundles.length === 0 && soldBundles.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#3a6a8f' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>No bundles yet</div>
          <div style={{ fontSize:12 }}>Create a bundle to group players for auction</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

          {availableBundles.map(bundle => {
            const bundlePlayers = players.filter(p => bundle.playerIds.includes(p.id))
            const isActive      = bundle.status === 'active'
            return (
              <div key={bundle.id} style={{ background:'#0a1e35', border:`1px solid ${isActive ? '#00c864' : '#1e3a5f'}`, borderRadius:14, padding:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, color:'#fff', fontWeight:700, marginBottom:6 }}>📦 {bundle.name}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {bundlePlayers.map(p => <PlayerChip key={p.id} player={p} />)}
                      {bundlePlayers.length === 0 && (
                        <span style={{ fontSize:12, color:'#ef4444', fontWeight:600 }}>⚠ Players no longer available</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    {!activeBundle && (
                      <button onClick={() => handleActivate(bundle)}
                        style={{ background:'linear-gradient(135deg,#00c864,#007a3d)', border:'none', borderRadius:8, padding:'8px 16px', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        🔨 Send to Auction
                      </button>
                    )}
                    <button onClick={() => setEditTarget(bundle)} title="Edit bundle"
                      style={{ background:'#1e3a5f', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', color:'#7ab4d8', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(bundle)} title="Delete bundle"
                      style={{ background:'#3a0d0d', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', color:'#f87171', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {soldBundles.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:11, color:'#3a6a8f', letterSpacing:1.5, fontWeight:700, marginBottom:8 }}>SOLD BUNDLES</div>
              {soldBundles.map(bundle => {
                const bundlePlayers = players.filter(p => bundle.playerIds.includes(p.id))
                const soldTeam      = teams.find(t => t.id === bundle.soldTo)
                const isBusy        = refundBusy === bundle.id
                return (
                  <div key={bundle.id} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:12, padding:14, marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, color:'#7ab4d8', fontWeight:700, marginBottom:4 }}>📦 {bundle.name}</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                          {bundlePlayers.map(p => <PlayerChip key={p.id} player={p} />)}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                        <div style={{ textAlign:'right' }}>
                          {soldTeam && (
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                              <div style={{ width:22, height:22, borderRadius:5, background:soldTeam.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:soldTeam.accent, fontWeight:800 }}>
                                {soldTeam.short}
                              </div>
                              <span style={{ fontSize:12, color:'#fff', fontWeight:700 }}>{soldTeam.name}</span>
                            </div>
                          )}
                          <div className="teko" style={{ fontSize:16, color:'#ffb060' }}>
                            {bundle.soldPoints?.toLocaleString()} pts
                          </div>
                        </div>
                        <button onClick={() => handleRefund(bundle)} disabled={isBusy}
                          title="Refund bundle"
                          style={{ background: isBusy ? '#1e3a5f' : '#1a3a2a', border:'1px solid #00c86444', borderRadius:8, padding:'7px 14px', color: isBusy ? '#5a8fba' : '#00c864', fontSize:12, fontWeight:700, cursor: isBusy ? 'not-allowed' : 'pointer', whiteSpace:'nowrap' }}
                          onMouseEnter={e => { if (!isBusy) e.currentTarget.style.background='#1e4a32' }}
                          onMouseLeave={e => { if (!isBusy) e.currentTarget.style.background='#1a3a2a' }}>
                          {isBusy ? '⏳ Refunding…' : '↩ Refund'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create modal — passes bundles so it can exclude already-bundled players */}
      {showCreate && (
        <BundleModal players={players} bundles={bundles} onSave={handleCreate} onClose={() => setShowCreate(false)} />
      )}

      {/* Edit modal */}
      {editTarget && (
        <BundleModal bundle={editTarget} players={players} bundles={bundles} onSave={handleUpdate} onClose={() => setEditTarget(null)} />
      )}
    </div>
  )
}