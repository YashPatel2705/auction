// src/pages/PlayersPage.jsx

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_STYLES = {
  batsman:         { bg: '#1a3a5c', text: '#7ab4d8', label: 'Batter' },
  bowler:          { bg: '#2a1a3a', text: '#b47ad8', label: 'Bowler' },
  'all-rounder':   { bg: '#1a3a2a', text: '#7ad8a4', label: 'All-Rounder' },
  'wicket-keeper': { bg: '#3a2a1a', text: '#d8a47a', label: 'Wicket-Keeper' },
}

const roleLabel = (r) => ROLE_STYLES[r]?.label ?? r ?? '-'
const roleStyle = (r) => ROLE_STYLES[r] ?? { bg: '#1e3a5f', text: '#7ab4d8' }

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 80 }) {
  const [err, setErr] = useState(false)
  const initials = (name ?? '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  if (src && !err) {
    return (
      <img src={src} alt={name} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          border: '2px solid #1e3a5f', flexShrink: 0 }} />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#0d2040',
      border: '2px solid #1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Teko',sans-serif", fontSize: size * 0.36, color: '#5a8fba', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

// ── Rating box ────────────────────────────────────────────────────────────────
function RatingBox({ label, value, color, large = false }) {
  return (
    <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 12,
      padding: large ? '14px 16px' : '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: large ? 11 : 10, color: '#5a8fba', fontWeight: 700,
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Teko',sans-serif", fontSize: large ? 42 : 30,
        color, lineHeight: 1, fontWeight: 600 }}>
        {value ?? '-'}
      </div>
    </div>
  )
}

// ── Badges helper ─────────────────────────────────────────────────────────────
function Badges({ player, large = false }) {
  const rs = roleStyle(player.role)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ background: rs.bg, color: rs.text,
        fontSize: large ? 12 : 10, fontWeight: 700,
        padding: large ? '4px 12px' : '2px 8px', borderRadius: 20,
        letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {roleLabel(player.role)}
      </span>
      {player.isKeeper && (
        <span style={{ background: '#3a2a10', color: '#ffd166',
          fontSize: large ? 12 : 10, fontWeight: 700,
          padding: large ? '4px 12px' : '2px 8px', borderRadius: 20,
          letterSpacing: 0.5, border: '1px solid #c08030' }}>
          🧤 KEEPER
        </span>
      )}
    </div>
  )
}

// ── Player card (grid) ────────────────────────────────────────────────────────
function RegistrationCard({ player, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background: '#08111e', border: '1px solid #1e3a5f', borderRadius: 14,
        padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'border-color .15s, transform .12s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2e5a8f'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e3a5f'; e.currentTarget.style.transform = 'translateY(0)' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar src={player.photoUrl} name={player.fullName} size={68} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#f0f4fa',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.fullName}
          </div>
          <div style={{ fontSize: 12, color: '#5a8fba', marginTop: 2 }}>{player.mobile}</div>
          <div style={{ marginTop: 6 }}>
            <Badges player={player} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <RatingBox label="Batting" value={player.battingRating} color="#00c864" />
        <RatingBox label="Bowling" value={player.bowlingRating} color="#b47ad8" />
      </div>
    </div>
  )
}

// ── Full-screen modal card ────────────────────────────────────────────────────
function PlayerModal({ player, onClose }) {
  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px' }}>

      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#0a1628', border: '1px solid #2e5a8f', borderRadius: 20,
          width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden', position: 'relative' }}>

        {/* Accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#00c864,#007a3d)' }} />

        {/* Close button */}
        <button onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: '#08111e',
            border: '1px solid #1e3a5f', borderRadius: 8, color: '#9fd2f2',
            fontSize: 16, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
          ✕
        </button>

        <div style={{ padding: '28px 28px 32px' }}>
          {/* Photo — large */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Avatar src={player.photoUrl} name={player.fullName} size={130} />
          </div>

          {/* Name */}
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div className="teko" style={{ fontSize: 30, color: '#f0f4fa', letterSpacing: 1, lineHeight: 1.1 }}>
              {player.fullName}
            </div>
            <div style={{ fontSize: 13, color: '#5a8fba', marginTop: 4 }}>{player.mobile}</div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <Badges player={player} large />
          </div>

          {/* Ratings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <RatingBox label="Batting Rating" value={player.battingRating} color="#00c864" large />
            <RatingBox label="Bowling Rating" value={player.bowlingRating} color="#b47ad8" large />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Login gate ────────────────────────────────────────────────────────────────
function LoginGate({ onSignIn }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)

  const attempt = async () => {
    if (!email || !password) return
    setBusy(true); setError('')
    try { await onSignIn(email, password) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 16px',
      background: '#060e1a' }}>
      <div style={{ fontSize: 52 }}>🏏</div>
      <div className="teko" style={{ fontSize: 28, letterSpacing: 2, color: '#fff' }}>PLAYERS LIST</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 380 }}>
        <input type="email" placeholder="Email address" value={email}
          onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ background: '#0a1e35', border: '1px solid #1e3a5f', borderRadius: 10,
            padding: '12px 16px', color: '#fff', fontSize: 15, fontWeight: 600 }} />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ background: '#0a1e35', border: '1px solid #1e3a5f', borderRadius: 10,
            padding: '12px 16px', color: '#fff', fontSize: 15, fontWeight: 600 }} />
        <button onClick={attempt} disabled={busy}
          style={{ background: busy ? '#1e3a5f' : 'linear-gradient(135deg,#00c864,#007a3d)',
            border: 'none', borderRadius: 10, padding: 13, color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 700 }}>❌ {error}</div>}
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────
const selectStyle = {
  background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 8,
  color: '#d8e8f7', fontSize: 13, padding: '8px 12px', cursor: 'pointer', outline: 'none',
}

const DEFAULTS = { search: '', role: 'all', keeper: 'all', sortBat: 'none', sortBowl: 'none' }

function FilterBar({ search, setSearch, role, setRole, keeper, setKeeper,
  sortBat, setSortBat, sortBowl, setSortBowl, total, filtered, onReset, isDirty }) {
  return (
    <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 14,
      padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>

      <input type="text" placeholder="Search by name or phone…" value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...selectStyle, flex: '1 1 180px', minWidth: 160, padding: '8px 14px' }} />

      <select value={role} onChange={e => setRole(e.target.value)} style={selectStyle}>
        <option value="all">All Roles</option>
        <option value="batsman">Batter</option>
        <option value="bowler">Bowler</option>
        <option value="all-rounder">All-Rounder</option>
        <option value="wicket-keeper">Wicket-Keeper</option>
      </select>

      <select value={keeper} onChange={e => setKeeper(e.target.value)} style={selectStyle}>
        <option value="all">All (Keeper)</option>
        <option value="yes">Keeper Only</option>
        <option value="no">Non-Keeper</option>
      </select>

      <select value={sortBat} onChange={e => { setSortBat(e.target.value); setSortBowl('none') }} style={selectStyle}>
        <option value="none">Batting: Default</option>
        <option value="desc">Batting: High to Low</option>
        <option value="asc">Batting: Low to High</option>
      </select>

      <select value={sortBowl} onChange={e => { setSortBowl(e.target.value); setSortBat('none') }} style={selectStyle}>
        <option value="none">Bowling: Default</option>
        <option value="desc">Bowling: High to Low</option>
        <option value="asc">Bowling: Low to High</option>
      </select>

      {isDirty && (
        <button onClick={onReset}
          style={{ background: '#2a1010', border: '1px solid #7f3030', borderRadius: 8,
            color: '#f87171', fontSize: 12, fontWeight: 700, padding: '8px 14px',
            cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ✕ Reset Filters
        </button>
      )}

      <div style={{ marginLeft: isDirty ? 0 : 'auto', fontSize: 12, color: '#5a8fba',
        fontWeight: 700, whiteSpace: 'nowrap' }}>
        {filtered} / {total} players
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlayersPage() {
  const { session, loading: authLoading, signIn, signOut, user } = useAuth()

  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [selected, setSelected] = useState(null)   // player shown in modal

  // Filters
  const [search,   setSearch]   = useState(DEFAULTS.search)
  const [role,     setRole]     = useState(DEFAULTS.role)
  const [keeper,   setKeeper]   = useState(DEFAULTS.keeper)
  const [sortBat,  setSortBat]  = useState(DEFAULTS.sortBat)
  const [sortBowl, setSortBowl] = useState(DEFAULTS.sortBowl)

  const isDirty = search !== DEFAULTS.search || role !== DEFAULTS.role ||
    keeper !== DEFAULTS.keeper || sortBat !== DEFAULTS.sortBat || sortBowl !== DEFAULTS.sortBowl

  const resetFilters = useCallback(() => {
    setSearch(DEFAULTS.search)
    setRole(DEFAULTS.role)
    setKeeper(DEFAULTS.keeper)
    setSortBat(DEFAULTS.sortBat)
    setSortBowl(DEFAULTS.sortBowl)
  }, [])

  // Fetch active registrations
  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      setLoading(true); setError('')
      const { data, error: err } = await supabase
        .from('registrations')
        .select('unique_id, full_name, mobile, batting_rating, bowling_rating, role, is_keeper, photo_url')
        .eq('active', true)
        .eq('player_category', 'player')
        .order('full_name', { ascending: true })

      if (err) { setError(err.message); setLoading(false); return }

      setRows((data ?? []).map(r => ({
        id:            r.unique_id,
        fullName:      r.full_name ?? '-',
        mobile:        r.mobile ?? '-',
        battingRating: r.batting_rating,
        bowlingRating: r.bowling_rating,
        role:          r.role ?? '',
        isKeeper:      !!r.is_keeper,
        photoUrl:      r.photo_url ?? '',
      })))
      setLoading(false)
    }

    fetchData()

    const channel = supabase
      .channel('players-page-registrations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, fetchData)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session])

  // Apply filters + sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const result = rows.filter(p => {
      if (q && !`${p.fullName} ${p.mobile}`.toLowerCase().includes(q)) return false
      if (role !== 'all' && p.role !== role) return false
      if (keeper === 'yes' && !p.isKeeper) return false
      if (keeper === 'no' && p.isKeeper) return false
      return true
    })
    if (sortBat !== 'none') {
      result.sort((a, b) => sortBat === 'desc'
        ? (b.battingRating ?? 0) - (a.battingRating ?? 0)
        : (a.battingRating ?? 0) - (b.battingRating ?? 0))
    } else if (sortBowl !== 'none') {
      result.sort((a, b) => sortBowl === 'desc'
        ? (b.bowlingRating ?? 0) - (a.bowlingRating ?? 0)
        : (a.bowlingRating ?? 0) - (b.bowlingRating ?? 0))
    }
    return result
  }, [rows, search, role, keeper, sortBat, sortBowl])

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#060e1a', color: '#5a8fba', fontSize: 15, fontWeight: 600 }}>
        Loading…
      </div>
    )
  }

  if (!session) return <LoginGate onSignIn={signIn} />

  return (
    <div style={{ minHeight: '100vh', background: '#060e1a', color: '#d8e8f7' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0a1628,#0d2040)', borderBottom: '1px solid #1e3a5f' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', height: 62,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#00c864,#007a3d)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏏</div>
            <div>
              <div className="teko" style={{ fontSize: 20, letterSpacing: 2, color: '#fff', lineHeight: 1 }}>
                HARI PRABODHAM BOX CRICKET
              </div>
              <div style={{ fontSize: 10, color: '#3a6a8f', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
                Registered Players
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#08111e',
            border: '1px solid #1e3a5f', borderRadius: 8, padding: '5px 12px' }}>
            <span style={{ fontSize: 11, color: '#5a8fba', fontWeight: 600,
              maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </span>
            <button onClick={signOut}
              style={{ background: 'none', border: 'none', color: '#ef4444',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: 20 }}>

        <FilterBar
          search={search}     setSearch={setSearch}
          role={role}         setRole={setRole}
          keeper={keeper}     setKeeper={setKeeper}
          sortBat={sortBat}   setSortBat={setSortBat}
          sortBowl={sortBowl} setSortBowl={setSortBowl}
          total={rows.length}
          filtered={filtered.length}
          onReset={resetFilters}
          isDirty={isDirty}
        />

        {loading && (
          <div style={{ textAlign: 'center', color: '#5a8fba', fontSize: 14, fontWeight: 600, padding: 40 }}>
            Loading players…
          </div>
        )}

        {error && (
          <div style={{ background: '#2a1010', border: '1px solid #7f1d1d', borderRadius: 12,
            padding: 16, color: '#f87171', fontSize: 13, fontWeight: 700 }}>
            ❌ {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#3a6a8f', fontSize: 14, fontWeight: 600, padding: 60 }}>
            No players match the current filters.
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'grid', gap: 16,
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {filtered.map(p => (
              <RegistrationCard key={p.id} player={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Full-screen modal */}
      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
