// src/pages/CaptainPage.jsx
// ─── Captain portal: login, view own squad + points, submit secret bids ───────
// Privacy: captains only see their own team. No cross-team data is fetched.

import { useState, useEffect } from 'react'
import { useCaptainTeam } from '../hooks/useCaptainTeam'
import { supabase } from '../lib/supabase'
import { ROLE_COLORS } from '../lib/constants'

// ── Login screen ─────────────────────────────────────────────────────────────
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
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:'0 16px' }}>
      <div style={{ fontSize:52 }}>🏏</div>
      <div className="teko" style={{ fontSize:28, letterSpacing:2, color:'#fff' }}>CAPTAIN LOGIN</div>
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

// ── Main captain page ─────────────────────────────────────────────────────────
export default function CaptainPage() {
  const { session, team, loading, error, signIn, signOut } = useCaptainTeam()

  // Squad — only this team's players
  const [players,       setPlayers]       = useState([])
  // Active bundle being auctioned
  const [activeBundle,  setActiveBundle]  = useState(null)
  const [bundlePlayers, setBundlePlayers] = useState([])
  // This team's bid for the current bundle + round
  const [myBid,         setMyBid]         = useState(null)
  // Bid form
  const [bidAmount,     setBidAmount]     = useState('')
  const [bidBusy,       setBidBusy]       = useState(false)
  const [bidError,      setBidError]      = useState('')

  // ── Load squad ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!team) { setPlayers([]); return }

    supabase.from('players').select('*').eq('sold_to', team.id).eq('status', 'sold')
      .then(({ data }) => setPlayers(data ?? []))

    const ch = supabase.channel(`cap-players-${team.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players' }, (payload) => {
        const p = payload.new
        setPlayers(prev => {
          if (p.status === 'sold' && p.sold_to === team.id) {
            const exists = prev.find(x => x.id === p.id)
            return exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]
          }
          return prev.filter(x => x.id !== p.id)
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'players' }, (payload) => {
        setPlayers(prev => prev.filter(x => x.id !== payload.old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [team?.id])

  // ── Watch for active bundle ──────────────────────────────────────────────
  useEffect(() => {
    const ACTIVE_STATUSES = ['active', 'bidding', 'reviewing']

    const loadBundle = async () => {
      const { data } = await supabase
        .from('bundles').select('*').in('status', ACTIVE_STATUSES).maybeSingle()
      setActiveBundle(data ?? null)
    }
    loadBundle()

    const ch = supabase.channel('cap-bundle-watch')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bundles' }, (payload) => {
        const s = payload.new.status
        if (ACTIVE_STATUSES.includes(s)) {
          setActiveBundle(payload.new)
        } else {
          setActiveBundle(prev => (prev?.id === payload.new.id ? null : prev))
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bundles' }, () => loadBundle())
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [])

  // ── Load bundle players ──────────────────────────────────────────────────
  useEffect(() => {
    if (!activeBundle?.player_ids?.length) { setBundlePlayers([]); return }
    supabase.from('players').select('*').in('id', activeBundle.player_ids)
      .then(({ data }) => setBundlePlayers(data ?? []))
  // activeBundle?.id changing covers player_ids changing too (same bundle object)
  }, [activeBundle?.id])

  // ── Load my bid for current round + subscribe to changes ─────────────────
  useEffect(() => {
    if (!activeBundle || !team) { setMyBid(null); return }
    const round = activeBundle.bid_round ?? 1

    supabase.from('bundle_bids').select('*')
      .eq('bundle_id', activeBundle.id).eq('team_id', team.id).eq('round', round)
      .maybeSingle()
      .then(({ data }) => setMyBid(data ?? null))

    const ch = supabase.channel(`cap-bid-${activeBundle.id}-${team.id}-r${round}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bundle_bids',
        filter: `bundle_id=eq.${activeBundle.id}` }, (payload) => {
        if (payload.new.team_id === team.id && payload.new.round === round) setMyBid(payload.new)
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bundle_bids' }, (payload) => {
        if (payload.old.team_id === team.id) { setMyBid(null); setBidAmount('') }
      })
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [activeBundle?.id, activeBundle?.bid_round, activeBundle?.status, team?.id])

  const cancelBid = async () => {
    if (!myBid) return
    setBidBusy(true); setBidError('')
    try {
      const { error } = await supabase.from('bundle_bids').delete().eq('id', myBid.id)
      if (error) throw new Error(error.message)
      // Clear state regardless — bid may already be gone if admin cancelled the round
      setMyBid(null)
      setBidAmount('')
    } catch (e) {
      setBidError(e.message)
    } finally {
      setBidBusy(false)
    }
  }

  const submitBid = async () => {
    const points = Number(bidAmount)
    if (!points || points < 1)        { setBidError('Enter a valid amount'); return }
    if (points > (team?.points ?? 0)) { setBidError(`You only have ${(team?.points ?? 0).toLocaleString()} points`); return }
    setBidBusy(true); setBidError('')
    try {
      const round = activeBundle.bid_round ?? 1

      // Delete any existing bid first (handles resubmit cleanly without needing UPDATE policy)
      await supabase.from('bundle_bids')
        .delete()
        .eq('bundle_id', activeBundle.id)
        .eq('team_id', team.id)
        .eq('round', round)

      // Fresh insert
      const { data, error } = await supabase.from('bundle_bids')
        .insert({ bundle_id: activeBundle.id, team_id: team.id, points, round })
        .select()
        .single()

      if (error) throw new Error(error.message)
      if (!data)  throw new Error('Bid was not saved — check your connection and try again')
      setMyBid(data)
    } catch (e) {
      setBidError(e.message)
    } finally {
      setBidBusy(false)
    }
  }

  // ── Guards ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ fontSize:52 }}>🏏</div>
      <div className="teko" style={{ fontSize:24, letterSpacing:3, color:'#00c864' }}>LOADING…</div>
    </div>
  )

  if (!session) return <LoginGate onSignIn={signIn} />

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:20 }}>
      <div style={{ fontSize:52 }}>❌</div>
      <div style={{ color:'#ef4444', fontSize:16, textAlign:'center' }}>{error}</div>
      <button onClick={signOut} style={{ background:'#1e3a5f', border:'none', borderRadius:8, padding:'10px 20px', color:'#7ab4d8', fontSize:14, fontWeight:700, cursor:'pointer' }}>
        Sign Out
      </button>
    </div>
  )

  const round = activeBundle?.bid_round ?? 1
  const isTiebreakerEligible = !activeBundle?.tiebreaker_teams ||
    activeBundle.tiebreaker_teams.includes(team?.id)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0a1628,#0d2040)', borderBottom:'1px solid #1e3a5f' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 20px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:9, background: team?.color ?? '#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color: team?.accent ?? '#fff', fontWeight:800 }}>
              {team?.short}
            </div>
            <div>
              <div className="teko" style={{ fontSize:20, letterSpacing:2, color:'#fff', lineHeight:1 }}>{team?.name}</div>
              <div style={{ fontSize:10, color:'#3a6a8f', letterSpacing:2, textTransform:'uppercase', fontWeight:700 }}>Captain Portal</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'6px 14px', textAlign:'center' }}>
              <div className="teko" style={{ fontSize:20, color:'#00c864', lineHeight:1 }}>{(team?.points ?? 0).toLocaleString()}</div>
              <div style={{ fontSize:9, color:'#5a8fba', textTransform:'uppercase', letterSpacing:1, fontWeight:700 }}>Points</div>
            </div>
            <button onClick={signOut} style={{ background:'none', border:'none', color:'#ef4444', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:18 }}>

        {/* ── Bundle Bidding Panel ─────────────────────────────────────── */}
        {activeBundle ? (
          <div className="fade-up" style={{
            background:'linear-gradient(160deg,#0a1e35,#0c2448)',
            borderRadius:16,
            border:`2px solid ${activeBundle.status === 'bidding' ? '#f59e0b44' : '#00c86444'}`,
            overflow:'hidden', marginBottom:24
          }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid #1e3a5f', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:14 }}>
                {activeBundle.status === 'bidding' ? '🎯' : activeBundle.status === 'reviewing' ? '⏳' : '📦'}
              </span>
              <span className="teko" style={{ fontSize:18, letterSpacing:1.5, color: activeBundle.status === 'bidding' ? '#f59e0b' : '#00c864' }}>
                {activeBundle.status === 'bidding'   ? 'PLACE YOUR SECRET BID' :
                 activeBundle.status === 'reviewing' ? 'BIDS SUBMITTED — AWAITING RESULT' :
                 'BUNDLE ON THE BLOCK'}
              </span>
              {round > 1 && (
                <span style={{ background:'#f59e0b22', border:'1px solid #f59e0b44', borderRadius:6, padding:'2px 8px', fontSize:11, color:'#f59e0b', fontWeight:700, marginLeft:'auto' }}>
                  ROUND {round} — TIEBREAKER
                </span>
              )}
            </div>

            <div style={{ padding:18, display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {/* Bundle players */}
              <div>
                <div style={{ fontSize:10, color:'#4a7fa8', letterSpacing:1.5, fontWeight:700, marginBottom:10 }}>
                  BUNDLE: {activeBundle.name}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {bundlePlayers.map(p => (
                    <div key={p.id} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ background:ROLE_COLORS[p.role]?.bg, color:ROLE_COLORS[p.role]?.text, borderRadius:4, padding:'1px 6px', fontSize:9, fontWeight:800 }}>
                        {p.role?.slice(0,3).toUpperCase()}
                      </span>
                      <span style={{ fontSize:13, color:'#d0e0f0', fontWeight:700 }}>{p.name}</span>
                      <span className="teko" style={{ marginLeft:'auto', fontSize:18, color:'#00c864' }}>{p.rating}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bid section */}
              <div style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
                {activeBundle.status === 'bidding' && isTiebreakerEligible ? (
                  myBid ? (
                    /* Already submitted */
                    <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
                      <div style={{ fontSize:40 }}>✅</div>
                      <div style={{ fontSize:14, color:'#00c864', fontWeight:700 }}>Bid locked in!</div>
                      <div className="teko" style={{ fontSize:40, color:'#fff' }}>{myBid.points.toLocaleString()}</div>
                      <div style={{ fontSize:11, color:'#5a8fba', fontWeight:600 }}>points — Round {myBid.round}</div>
                      <div style={{ fontSize:12, color:'#4a7fa8', textAlign:'center', fontWeight:600 }}>Waiting for other captains…</div>
                      <button onClick={cancelBid} disabled={bidBusy}
                        style={{ background:'none', border:'1px solid #ef444466', borderRadius:8, padding:'6px 16px', color:'#ef4444', fontSize:12, fontWeight:700, cursor: bidBusy ? 'not-allowed' : 'pointer', marginTop:4 }}>
                        {bidBusy ? 'Cancelling…' : '✕ Cancel & Resubmit'}
                      </button>
                    </div>
                  ) : (
                    /* Submit form */
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      <div style={{ fontSize:11, color:'#5a8fba', fontWeight:600 }}>
                        Your balance: <span style={{ color:'#00c864', fontSize:15 }}>{(team?.points ?? 0).toLocaleString()}</span> pts
                      </div>
                      <label style={{ fontSize:11, color:'#4a7fa8', letterSpacing:1 }}>YOUR SECRET BID</label>
                      <input type="number" min={1} max={team?.points ?? 100000} value={bidAmount}
                        onChange={e => { setBidAmount(e.target.value); setBidError('') }}
                        placeholder="Enter bid amount"
                        style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:8, padding:'12px 14px', color:'#fff', fontSize:20, fontWeight:700, width:'100%', boxSizing:'border-box' }} />
                      {bidError && <div style={{ color:'#ef4444', fontSize:12, fontWeight:600 }}>⚠ {bidError}</div>}
                      <div style={{ fontSize:11, color:'#4a7fa8', fontWeight:600 }}>🔒 Other teams cannot see your bid</div>
                      <button onClick={submitBid} disabled={bidBusy || !bidAmount}
                        style={{ background: !bidBusy && bidAmount ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#1e3a5f', border:'none', borderRadius:10, padding:14, color: !bidBusy && bidAmount ? '#000' : '#5a8fba', fontSize:15, fontFamily:"'Teko',sans-serif", letterSpacing:2, cursor: !bidBusy && bidAmount ? 'pointer' : 'not-allowed' }}>
                        {bidBusy ? '⏳ Submitting…' : '🔒 LOCK IN BID'}
                      </button>
                    </div>
                  )
                ) : activeBundle.status === 'bidding' && !isTiebreakerEligible ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
                    <div style={{ fontSize:40 }}>🚫</div>
                    <div style={{ fontSize:14, color:'#ef4444', fontWeight:700, textAlign:'center' }}>Your team is not in this tiebreaker</div>
                    <div style={{ fontSize:12, color:'#4a7fa8', textAlign:'center', fontWeight:600 }}>Awaiting result…</div>
                  </div>
                ) : activeBundle.status === 'reviewing' ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
                    <div style={{ fontSize:40 }}>⏳</div>
                    <div style={{ fontSize:14, color:'#00c864', fontWeight:700 }}>All bids in!</div>
                    <div style={{ fontSize:12, color:'#4a7fa8', textAlign:'center', fontWeight:600 }}>Admin is reviewing bids. Result coming soon…</div>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
                    <div style={{ fontSize:40 }}>👀</div>
                    <div style={{ fontSize:14, color:'#7ab4d8', fontWeight:700 }}>Bundle announced!</div>
                    <div style={{ fontSize:12, color:'#4a7fa8', textAlign:'center', fontWeight:600 }}>Bidding will open soon. Stay ready!</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="fade-up" style={{ background:'#0a1e35', borderRadius:16, border:'1px solid #1e3a5f', padding:30, textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📦</div>
            <div style={{ fontSize:14, color:'#4a7fa8', fontWeight:600 }}>No bundle on the block right now</div>
            <div style={{ fontSize:12, color:'#2a4a6f', marginTop:4, fontWeight:600 }}>Admin will announce a bundle when ready</div>
          </div>
        )}

        {/* ── My Squad ─────────────────────────────────────────────────── */}
        <div style={{ background:'#0a1e35', borderRadius:16, border:'1px solid #1e3a5f', overflow:'hidden' }}>
          <div style={{ padding:'13px 18px', borderBottom:'1px solid #1e3a5f', display:'flex', alignItems:'center', gap:10 }}>
            <span className="teko" style={{ fontSize:18, letterSpacing:1.5, color:'#fff' }}>MY SQUAD</span>
            <span style={{ fontSize:13, color:'#4a7fa8', fontWeight:600 }}>{players.length} players</span>
          </div>
          <div style={{ padding:16 }}>
            {players.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:'#2a4a6f', fontWeight:600, fontSize:13 }}>
                No players in squad yet
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
                {players.map(p => (
                  <div key={p.id} style={{ background:'#08111e', border:'1px solid #1e3a5f', borderRadius:12, padding:14 }}>
                    <div style={{ fontSize:13, color:'#fff', fontWeight:700, marginBottom:6 }}>{p.name}</div>
                    <span style={{ background:ROLE_COLORS[p.role]?.bg, color:ROLE_COLORS[p.role]?.text, borderRadius:4, padding:'1px 6px', fontSize:9, fontWeight:800 }}>
                      {p.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
