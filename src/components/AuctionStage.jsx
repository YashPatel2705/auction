// src/components/AuctionStage.jsx

import { useState, useMemo, useEffect } from 'react'
import { TEAMS, ROLES, ROLE_COLORS } from '../lib/constants'
import PlayerCard from './PlayerCard'

export default function AuctionStage({ players, onSell, showToast, jumpToPlayer, onJumpConsumed }) {
  const [auctionPlayer, setAuctionPlayer] = useState(null)
  const [selectedTeam,  setSelectedTeam]  = useState(null)
  const [search,        setSearch]        = useState('')
  const [roleFilter,    setRoleFilter]    = useState('All')
  const [busy,          setBusy]          = useState(false)

  // When a player is clicked from the Pool tab, auto-select them here
  useEffect(() => {
    if (jumpToPlayer) {
      setAuctionPlayer(jumpToPlayer)
      setSelectedTeam(null)
      onJumpConsumed?.()
    }
  }, [jumpToPlayer])

  const available = useMemo(() => players.filter((p) => p.status === 'available'), [players])

  const filtered = useMemo(() =>
    available.filter((p) => {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) &&
        (roleFilter === 'All' || p.role === roleFilter)
    }),
    [available, search, roleFilter]
  )

  const selectPlayer = (player) => {
    setAuctionPlayer(player)
    setSelectedTeam(null)
  }

  const cancelSelection = () => {
    setAuctionPlayer(null)
    setSelectedTeam(null)
  }

  const handleSell = async () => {
    if (!auctionPlayer || !selectedTeam) return
    setBusy(true)
    try {
      await onSell({ playerId: auctionPlayer.id, teamId: selectedTeam })
      const teamName = TEAMS.find((t) => t.id === selectedTeam)?.name
      showToast(`${auctionPlayer.name} sold to ${teamName}!`)
      cancelSelection()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fade-up"
      style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}
    >
      {/* ── LEFT: Stage panel ── */}
      <div style={{
        background: 'linear-gradient(160deg,#0a1e35,#0c2448)',
        borderRadius: 16, border: '1px solid #1e3a5f', overflow: 'hidden',
      }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔨</span>
          <span className="teko" style={{ fontSize: 19, letterSpacing: 1.5, color: '#fff' }}>AUCTION STAGE</span>
        </div>

        <div style={{ padding: 16 }}>
          {!auctionPlayer ? (
            <div style={{ textAlign: 'center', padding: '50px 10px' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🏏</div>
              <div style={{ color: '#4a7fa8', fontSize: 14 }}>Select a player from the list</div>
              <div style={{ color: '#1e3a5f', fontSize: 12, marginTop: 4 }}>to put them on the auction block</div>
            </div>
          ) : (
            <div className="slide-in">
              {/* Player info */}
              <div style={{ background: '#08111e', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #1e3a5f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="teko" style={{ fontSize: 26, color: '#fff', lineHeight: 1.1 }}>{auctionPlayer.name}</div>
                    <span
                      className="badge"
                      style={{ marginTop: 6, background: ROLE_COLORS[auctionPlayer.role]?.bg, color: ROLE_COLORS[auctionPlayer.role]?.text }}
                    >
                      {auctionPlayer.role}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 10 }}>
                    <div style={{ fontSize: 9, color: '#4a7fa8', letterSpacing: 1 }}>RATING</div>
                    <div className="teko" style={{ fontSize: 36, color: '#00c864', lineHeight: 1 }}>{auctionPlayer.rating}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #1e3a5f', paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={cancelSelection}
                    style={{ background: 'none', border: '1px solid #1e3a5f', borderRadius: 6, padding: '4px 12px', color: '#4a7fa8', fontSize: 12, cursor: 'pointer' }}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>

              {/* Team selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 10, color: '#4a7fa8', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                  ASSIGN TO TEAM
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {TEAMS.map((team) => {
                    const active = selectedTeam === team.id
                    return (
                      <button
                        key={team.id}
                        className="chip"
                        onClick={() => setSelectedTeam(active ? null : team.id)}
                        style={{
                          background: active ? team.color + '28' : '#08111e',
                          border: `2px solid ${active ? team.color : '#1e3a5f'}`,
                          borderRadius: 8, padding: '8px 10px',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: team.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: active ? '#fff' : '#6a9abf', fontWeight: 700 }}>{team.short}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                className="sell-btn"
                onClick={handleSell}
                disabled={!selectedTeam || busy}
                style={{
                  width: '100%',
                  background: selectedTeam && !busy ? 'linear-gradient(135deg,#00c864,#007a3d)' : '#1e3a5f',
                  border: 'none', borderRadius: 10, padding: 14,
                  color: '#fff', fontSize: 16,
                  fontFamily: "'Teko', sans-serif", letterSpacing: 2,
                  cursor: selectedTeam && !busy ? 'pointer' : 'not-allowed',
                }}
              >
                {busy ? '⏳ Saving…' : '⚡ CONFIRM SOLD'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Player list ── */}
      <div style={{ background: '#0a1e35', borderRadius: 16, border: '1px solid #1e3a5f', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e3a5f', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 Search player…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 150, background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13 }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '8px 12px', color: '#7ab4d8', fontSize: 13 }}
          >
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <span style={{ fontSize: 12, color: '#3a6a8f' }}>{filtered.length} players</span>
        </div>

        <div style={{
          maxHeight: 'calc(100vh - 245px)', overflowY: 'auto',
          padding: 12,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 8,
        }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 50, color: '#3a6a8f' }}>
              No available players match the filter
            </div>
          )}
          {filtered.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              compact
              isSelected={auctionPlayer?.id === player.id}
              onClick={() => selectPlayer(player)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}