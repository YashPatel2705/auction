// src/pages/AdminPage.jsx

import { useEffect, useState } from 'react'
import { useAuth }         from '../hooks/useAuth'
import { usePlayers }      from '../hooks/usePlayers'
import { useTeams }        from '../hooks/useTeams'
import { useBundles }      from '../hooks/useBundles'
import { useToast }        from '../hooks/useToast'
import { supabase }        from '../lib/supabase'
import AuctionStage        from '../components/AuctionStage'
import PlayerPool          from '../components/PlayerPool'
import TeamsView           from '../components/TeamsView'
import SpinWheel           from '../components/SpinWheel'
import ManagePlayers       from '../components/ManagePlayers'
import ManageTeams         from '../components/ManageTeams'
import BundleAuction       from '../components/BundleAuction'
import Toast               from '../components/Toast'

function LoginGate({ onSignIn }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)

  const attempt = async () => {
    if (!email || !password) return
    setBusy(true)
    setError('')
    try { await onSignIn(email, password) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:'0 16px' }}>
      <div style={{ fontSize:52 }}>🔒</div>
      <div className="teko" style={{ fontSize:28, letterSpacing:2, color:'#fff' }}>ADMIN LOGIN</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:380 }}>
        <input type="email" placeholder="Email address" value={email}
          onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ background:'#0a1e35', border:'1px solid #1e3a5f', borderRadius:10, padding:'12px 16px', color:'#fff', fontSize:15, fontWeight:600 }} />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ background:'#0a1e35', border:'1px solid #1e3a5f', borderRadius:10, padding:'12px 16px', color:'#fff', fontSize:15, fontWeight:600 }} />
        <button onClick={attempt} disabled={busy}
          style={{ background: busy ? '#1e3a5f' : 'linear-gradient(135deg,#00c864,#007a3d)', border:'none', borderRadius:10, padding:13, color:'#fff', fontSize:15, fontWeight:700, cursor: busy ? 'not-allowed' : 'pointer' }}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
      {error && <div style={{ color:'#ef4444', fontSize:13, fontWeight:700 }}>❌ {error}</div>}
    </div>
  )
}

function Header({ players, user, onReset, onSignOut }) {
  const available = players.filter(p => p.status === 'available').length
  const sold      = players.filter(p => p.status === 'sold').length
  return (
    <div style={{ background:'linear-gradient(135deg,#0a1628,#0d2040)', borderBottom:'1px solid #1e3a5f' }}>
      <div className="mob-header-inner" style={{ maxWidth:1440, margin:'0 auto', padding:'0 20px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#00c864,#007a3d)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🏏</div>
          <div>
            <div className="teko" style={{ fontSize:20, letterSpacing:2, color:'#fff', lineHeight:1 }}>HARI PRABODHAM BOX CRICKET AUCTION</div>
            <div style={{ fontSize:10, color:'#3a6a8f', letterSpacing:2, textTransform:'uppercase', fontWeight:700 }}>Admin Panel</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="mob-header-stats" style={{ display:'flex', gap:8 }}>
            {[{ l:'Available', v:available, c:'#00c864' }, { l:'Sold', v:sold, c:'#ffb060' }].map(s => (
              <div key={s.l} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'5px 14px', textAlign:'center' }}>
                <div className="teko" style={{ fontSize:20, color:s.c, lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:9, color:'#5a8fba', textTransform:'uppercase', letterSpacing:1, fontWeight:700 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <button className="mob-reset-btn" onClick={onReset}
            style={{ background:'#3a0d0d', border:'1px solid #7f1d1d', borderRadius:8, padding:'7px 14px', color:'#f87171', fontSize:12, fontWeight:700, cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background='#5a1515'}
            onMouseLeave={e => e.currentTarget.style.background='#3a0d0d'}>
            ↺ Reset All
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'5px 12px' }}>
            <span style={{ fontSize:11, color:'#5a8fba', fontWeight:600, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.email}
            </span>
            <button onClick={onSignOut}
              style={{ background:'none', border:'none', color:'#ef4444', fontSize:12, fontWeight:700, cursor:'pointer', padding:0 }}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const fmtBool = (value) => (value ? 'Yes' : 'No')

function PlayersDataTable() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [photoFilter, setPhotoFilter] = useState('all')
  const [tshirtFilter, setTshirtFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [keeperFilter, setKeeperFilter] = useState('all')

  useEffect(() => {
    const mapRow = (row) => ({
      id: row.id,
      fullName: row.full_name ?? '-',
      email: row.email ?? '-',
      phoneNumber: row.mobile ?? '-',
      status: row.status ?? '-',
      referenceName: row.reference_name ?? '-',
      battingRating: row.batting_rating ?? '-',
      bowlingRating: row.bowling_rating ?? '-',
      photoUrl: row.photo_url ?? '',
      tshirtSize: row.tshirt_size ?? '-',
      role: row.role ?? '-',
      isKeeper: !!row.is_keeper,
    })

    const fetchRows = async () => {
      setLoading(true)
      setError('')
      const { data, error: fetchErr } = await supabase
        .from('registrations')
        .select('id, full_name, email, mobile, status, reference_name, batting_rating, bowling_rating, photo_url, tshirt_size, role, is_keeper, active')
        .eq('active', true)
        .order('created_at', { ascending: true })

      if (fetchErr) {
        setError(fetchErr.message)
        setLoading(false)
        return
      }

      setRows((data ?? []).map(mapRow))
      setLoading(false)
    }

    fetchRows()

    const channel = supabase
      .channel('registrations-admin-table')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => fetchRows())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div style={{ background:'#0a1628', border:'1px solid #1e3a5f', borderRadius:14, padding:16, color:'#7ab4d8', fontSize:14, fontWeight:600 }}>
        Loading players data...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background:'#2a1010', border:'1px solid #7f1d1d', borderRadius:14, padding:16, color:'#f87171', fontSize:13, fontWeight:700 }}>
        Failed to load players data: {error}
      </div>
    )
  }

  const PRIMARY_LIMIT = 160
  const primaryRowsAll = rows.slice(0, PRIMARY_LIMIT)
  const waitingRowsAll = rows.slice(PRIMARY_LIMIT)
  const columns = ['Full Name', 'Email', 'Phone Number', 'Status', 'Reference Name', 'Batting Rating', 'Bowling Rating', 'Photo', 'Tshirt Size', 'Role', 'Is Keeper']
  const normalize = (value) => String(value ?? '').trim().toLowerCase()

  const statusOptions = [...new Set(rows.map(r => normalize(r.status)).filter(Boolean).filter(v => v !== '-'))]
  const tshirtOptions = [...new Set(rows.map(r => String(r.tshirtSize ?? '').trim()).filter(Boolean).filter(v => v !== '-'))]
  const roleOptions = [...new Set(rows.map(r => normalize(r.role)).filter(Boolean).filter(v => v !== '-'))]

  const matchesFilters = (row) => {
    const q = normalize(searchTerm)
    if (q) {
      const searchable = `${row.fullName} ${row.email} ${row.phoneNumber}`.toLowerCase()
      if (!searchable.includes(q)) return false
    }
    if (statusFilter !== 'all' && normalize(row.status) !== statusFilter) return false
    if (photoFilter === 'yes' && !row.photoUrl) return false
    if (photoFilter === 'no' && row.photoUrl) return false
    if (tshirtFilter !== 'all' && String(row.tshirtSize ?? '').trim() !== tshirtFilter) return false
    if (roleFilter !== 'all' && normalize(row.role) !== roleFilter) return false
    if (keeperFilter === 'yes' && !row.isKeeper) return false
    if (keeperFilter === 'no' && row.isKeeper) return false
    return true
  }

  const primaryRows = primaryRowsAll.filter(matchesFilters)
  const waitingRows = waitingRowsAll.filter(matchesFilters)
  const filteredTotal = primaryRows.length + waitingRows.length

  const renderTable = (tableRows, emptyText) => (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', minWidth:1380, borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ background:'#08111e' }}>
            {columns.map((col) => (
              <th key={col} style={{ textAlign:'left', padding:'12px 14px', color:'#84bde3', fontSize:11, textTransform:'uppercase', letterSpacing:0.8, borderBottom:'1px solid #1e3a5f', whiteSpace:'nowrap' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, idx) => (
            <tr key={row.id} style={{ background: idx % 2 ? '#091628' : '#0a1628' }}>
              <td style={{ padding:'10px 14px', color:'#e8edf5', fontSize:13, fontWeight:600, whiteSpace:'nowrap' }}>{row.fullName}</td>
              <td style={{ padding:'10px 14px', color:'#9fd2f2', fontSize:13, whiteSpace:'nowrap' }}>{row.email}</td>
              <td style={{ padding:'10px 14px', color:'#d8e8f7', fontSize:13, whiteSpace:'nowrap' }}>{row.phoneNumber}</td>
              <td style={{ padding:'10px 14px', color: row.status === 'paid' ? '#00c864' : '#ffb060', fontSize:12, fontWeight:700, textTransform:'uppercase', whiteSpace:'nowrap' }}>{row.status}</td>
              <td style={{ padding:'10px 14px', color:'#d8e8f7', fontSize:13, whiteSpace:'nowrap' }}>{row.referenceName}</td>
              <td style={{ padding:'10px 14px', color:'#e8edf5', fontSize:13, whiteSpace:'nowrap' }}>{row.battingRating}</td>
              <td style={{ padding:'10px 14px', color:'#e8edf5', fontSize:13, whiteSpace:'nowrap' }}>{row.bowlingRating}</td>
              <td style={{ padding:'10px 14px', color:'#d8e8f7', fontSize:13, whiteSpace:'nowrap' }}>
                {row.photoUrl ? (
                  <a href={row.photoUrl} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#7ec3ee', fontWeight:700, textDecoration:'none' }}>
                    <img src={row.photoUrl} alt={row.fullName} style={{ width:34, height:34, objectFit:'cover', borderRadius:6, border:'1px solid #1e3a5f' }} />
                    View
                  </a>
                ) : '-'}
              </td>
              <td style={{ padding:'10px 14px', color:'#e8edf5', fontSize:13, whiteSpace:'nowrap' }}>{row.tshirtSize}</td>
              <td style={{ padding:'10px 14px', color:'#e8edf5', fontSize:13, textTransform:'capitalize', whiteSpace:'nowrap' }}>{row.role}</td>
              <td style={{ padding:'10px 14px', color:'#e8edf5', fontSize:13, whiteSpace:'nowrap' }}>{fmtBool(row.isKeeper)}</td>
            </tr>
          ))}
          {tableRows.length === 0 && (
            <tr>
              <td colSpan={11} style={{ padding:18, color:'#7ab4d8', fontSize:13, fontWeight:600, textAlign:'center' }}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:'#0a1628', border:'1px solid #1e3a5f', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div className="teko" style={{ color:'#fff', fontSize:24, letterSpacing:1.3 }}>TOTAL REGISTRATIONS</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:'#7ab4d8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8 }}>All</span>
          <span style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'6px 10px', color:'#00c864', fontWeight:800, fontSize:13 }}>{rows.length}</span>
          <span style={{ fontSize:11, color:'#7ab4d8', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8 }}>Filtered</span>
          <span style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'6px 10px', color:'#9fd2f2', fontWeight:800, fontSize:13 }}>{filteredTotal}</span>
        </div>
      </div>

      <div style={{ background:'#0a1628', border:'1px solid #1e3a5f', borderRadius:14, padding:14, display:'grid', gridTemplateColumns:'repeat(6, minmax(140px, 1fr))', gap:10 }}>
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search name, email, phone"
          style={{ gridColumn:'span 2', background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'10px 12px', color:'#e8edf5', fontSize:13, fontWeight:600 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'10px 12px', color:'#e8edf5', fontSize:13, fontWeight:600 }}>
          <option value="all">Status: All</option>
          {statusOptions.map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
        </select>
        <select value={photoFilter} onChange={e => setPhotoFilter(e.target.value)} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'10px 12px', color:'#e8edf5', fontSize:13, fontWeight:600 }}>
          <option value="all">Photo: All</option>
          <option value="yes">Photo: Yes</option>
          <option value="no">Photo: No</option>
        </select>
        <select value={tshirtFilter} onChange={e => setTshirtFilter(e.target.value)} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'10px 12px', color:'#e8edf5', fontSize:13, fontWeight:600 }}>
          <option value="all">Tshirt: All</option>
          {tshirtOptions.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'10px 12px', color:'#e8edf5', fontSize:13, fontWeight:600 }}>
          <option value="all">Role: All</option>
          {roleOptions.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={keeperFilter} onChange={e => setKeeperFilter(e.target.value)} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'10px 12px', color:'#e8edf5', fontSize:13, fontWeight:600 }}>
          <option value="all">Keeper: All</option>
          <option value="yes">Keeper: Yes</option>
          <option value="no">Keeper: No</option>
        </select>
        <button
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setPhotoFilter('all')
            setTshirtFilter('all')
            setRoleFilter('all')
            setKeeperFilter('all')
          }}
          style={{ background:'#1b2c43', border:'1px solid #33577f', borderRadius:8, padding:'10px 12px', color:'#9fd2f2', fontSize:12, fontWeight:700, cursor:'pointer' }}
        >
          Clear Filters
        </button>
      </div>

      <div style={{ background:'#0a1628', border:'1px solid #1e3a5f', borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #1e3a5f', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <div className="teko" style={{ color:'#fff', fontSize:26, letterSpacing:1.5 }}>PLAYERS DATA</div>
          <div style={{ fontSize:12, color:'#6fa4c8', fontWeight:700 }}>{primaryRows.length} / {primaryRowsAll.length} rows</div>
        </div>
        {renderTable(primaryRows, 'No players match filters in primary pool.')}
      </div>

      <div style={{ background:'#0a1628', border:'1px solid #7f1d1d', borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #7f1d1d', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <div className="teko" style={{ color:'#fecaca', fontSize:24, letterSpacing:1.5 }}>WAITING POOL</div>
          <div style={{ fontSize:12, color:'#fca5a5', fontWeight:700 }}>{waitingRows.length} / {waitingRowsAll.length} rows</div>
        </div>
        <div style={{ padding:'10px 16px', color:'#fca5a5', fontSize:12, fontWeight:700, borderBottom:'1px solid #7f1d1d' }}>
          The rest after first 160 registrations are in waiting pool.
        </div>
        {renderTable(waitingRows, 'No players match filters in waiting pool.')}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { session, loading: authLoading, user, signIn, signOut } = useAuth()
  const [view,     setView]     = useState('players-data')
  const [poolJump, setPoolJump] = useState(null)

  const { players, loading:pLoad, error:pErr, sellPlayer, releasePlayer, resetAuction, updatePlayer, deletePlayer, addPlayer } = usePlayers()
  const { teams,   loading:tLoad, error:tErr, addTeam, updateTeam, deleteTeam, setCaptain, setViceCaptain } = useTeams()
  const { bundles, createBundle, updateBundle, deleteBundle, activateBundle, deactivateBundle, openBidding, closeBidding, startTiebreaker, revertBundleToActive, sellBundle, refundBundle } = useBundles()
  const { toast, showToast } = useToast()

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ fontSize:52 }}>🏏</div>
      <div className="teko" style={{ fontSize:24, letterSpacing:3, color:'#00c864' }}>LOADING…</div>
    </div>
  )

  if (!session) return <LoginGate onSignIn={signIn} />

  const handleReset = async () => {
    if (!window.confirm('Reset entire auction? All players, points and bundles reset.')) return
    try { await resetAuction(); showToast('Auction reset — all players, points and bundles reset') }
    catch (err) { showToast(err.message, 'error') }
  }

  const handlePoolSelect = (player) => { setPoolJump(player); setView('auction') }

  const loading = pLoad || tLoad
  const error   = pErr  || tErr

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ fontSize:52 }}>🏏</div>
      <div className="teko" style={{ fontSize:24, letterSpacing:3, color:'#00c864' }}>LOADING…</div>
      <div style={{ width:200, height:3, background:'#1e3a5f', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:'55%', background:'#00c864', borderRadius:2, animation:'loadBar 1s ease-in-out infinite' }} />
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444', fontSize:16, padding:16, textAlign:'center' }}>
      ❌ Supabase error: {error}
    </div>
  )

  const available      = players.filter(p => p.status === 'available').length
  const activeBundles  = bundles.filter(b => ['active', 'bidding', 'reviewing'].includes(b.status)).length

  const TABS = [
    { id:'spin',           icon:'🎯', label:'Spin Wheel'    },
    { id:'auction',        icon:'🔨', label:'Auction Stage' },
    { id:'pool',           icon:'👥', label:'Player Pool',   badge: available },
    { id:'bundles',        icon:'📦', label:'Bundles',       badge: activeBundles || null },
    { id:'teams',          icon:'🏆', label:'Teams'          },
    { id:'players-data',   icon:'📋', label:'Players Data'   },
    { id:'manage-players', icon:'⚙️', label:'Edit Players'   },
    { id:'manage-teams',   icon:'🛠️', label:'Edit Teams'     },
  ]

  return (
    <div style={{ minHeight:'100vh' }}>
      <Header players={players} user={user} onReset={handleReset} onSignOut={signOut} />

      <div className="mob-nav" style={{ background:'#0a1628', borderBottom:'1px solid #1e3a5f', padding:'0 20px' }}>
        <div style={{ maxWidth:1440, margin:'0 auto', display:'flex' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              style={{
                background:'none', border:'none',
                borderBottom: view===t.id ? '2px solid #00c864' : '2px solid transparent',
                padding:'13px 15px', color: view===t.id ? '#00c864' : '#6a9abf',
                fontWeight:700, fontSize:13, letterSpacing:0.4,
                cursor:'pointer', whiteSpace:'nowrap', transition:'color .15s',
                display:'flex', alignItems:'center', gap:5,
              }}>
              {t.icon} {t.label}
              {t.badge != null && (
                <span style={{ background: t.id === 'bundles' ? '#00c86433' : '#1e3a5f', borderRadius:10, padding:'1px 7px', fontSize:11, color: t.id === 'bundles' ? '#00c864' : '#7ab4d8', fontWeight:700 }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mob-content" style={{ maxWidth:1440, margin:'0 auto', padding:18 }}>
        {view==='spin'           && <SpinWheel teams={teams} onTeamSelected={team => showToast(`${team.name} is up next!`)} />}
        {view==='auction'        && <AuctionStage players={players} teams={teams} onSell={sellPlayer} showToast={showToast} jumpToPlayer={poolJump} onJumpConsumed={() => setPoolJump(null)} />}
        {view==='pool'           && <PlayerPool players={players} onSelectForAuction={handlePoolSelect} />}
        {view==='bundles'        && (
          <BundleAuction
            players={players}
            teams={teams}
            bundles={bundles}
            onCreate={createBundle}
            onUpdate={updateBundle}
            onDelete={deleteBundle}
            onActivate={activateBundle}
            onDeactivate={deactivateBundle}
            onOpenBidding={openBidding}
            onCloseBidding={closeBidding}
            onStartTiebreaker={startTiebreaker}
            onRevertToActive={revertBundleToActive}
            onSell={sellBundle}
            onRefund={refundBundle}
            showToast={showToast}
          />
        )}
        {view==='teams'          && <TeamsView players={players} teams={teams} onRelease={releasePlayer} setCaptain={setCaptain} setViceCaptain={setViceCaptain} isAdmin={true} showToast={showToast} />}
        {view==='players-data'   && <PlayersDataTable />}
        {view==='manage-players' && <ManagePlayers players={players} onUpdate={updatePlayer} onDelete={deletePlayer} onAdd={addPlayer} showToast={showToast} />}
        {view==='manage-teams'   && <ManageTeams teams={teams} onAdd={addTeam} onUpdate={updateTeam} onDelete={deleteTeam} showToast={showToast} />}
      </div>

      <Toast toast={toast} />
    </div>
  )
}