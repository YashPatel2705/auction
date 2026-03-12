// src/components/SpinWheel.jsx

import { useState, useRef, useEffect, useCallback } from 'react'

const SPIN_DURATION = 4000

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

export default function SpinWheel({ teams = [], onTeamSelected }) {
  const canvasRef       = useRef(null)
  const [spinning,    setSpinning]    = useState(false)
  const [spinOrder,   setSpinOrder]   = useState([])
  const [winner,      setWinner]      = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const animRef         = useRef(null)
  const startTimeRef    = useRef(null)
  const targetRotRef    = useRef(0)
  const currentRotRef   = useRef(0)
  // Keep a ref to remaining so animate() closure always reads current value
  const remainingRef    = useRef([])
  const teamsRef        = useRef([])

  const windowWidth = useWindowWidth()
  const canvasSize  = windowWidth <= 420 ? 220 : windowWidth <= 768 ? 260 : 320

  const remaining = teams.filter(t => !spinOrder.find(s => s.id === t.id))
  const allDone   = remaining.length === 0

  // Keep refs in sync
  remainingRef.current = remaining
  teamsRef.current     = teams

  const drawWheel = useCallback((rot) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx    = canvas.getContext('2d')
    const cx     = canvas.width  / 2
    const cy     = canvas.height / 2
    const radius = cx - 8
    const list   = remainingRef.current.length > 0 ? remainingRef.current : teamsRef.current
    if (list.length === 0) return
    const slice  = (2 * Math.PI) / list.length

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    list.forEach((team, i) => {
      const start = rot + i * slice
      const end   = start + slice
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, start, end)
      ctx.closePath()
      ctx.fillStyle = team.color
      ctx.fill()
      ctx.strokeStyle = '#070d14'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + slice / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = team.accent
      ctx.font = 'bold 13px Teko, sans-serif'
      ctx.fillText(team.short, radius - 12, 5)
      ctx.restore()
    })

    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI)
    ctx.fillStyle = '#070d14'
    ctx.fill()
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.font = '16px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏏', cx, cy)
  }, [])

  const easeOut = (t) => 1 - Math.pow(1 - t, 3)

  const animate = useCallback((timestamp) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp
    const elapsed  = timestamp - startTimeRef.current
    const progress = Math.min(elapsed / SPIN_DURATION, 1)
    const eased    = easeOut(progress)
    const rot      = currentRotRef.current + eased * (targetRotRef.current - currentRotRef.current)
    drawWheel(rot)

    if (progress < 1) {
      animRef.current = requestAnimationFrame(animate)
    } else {
      // Use refs so we always get the latest value, not a stale closure
      const list     = remainingRef.current.length > 0 ? remainingRef.current : teamsRef.current
      const slice    = (2 * Math.PI) / list.length
      const finalRot = targetRotRef.current % (2 * Math.PI)
      const pointer  = ((-Math.PI / 2) - finalRot + 4 * Math.PI) % (2 * Math.PI)
      const idx      = Math.floor(pointer / slice) % list.length
      currentRotRef.current = targetRotRef.current
      setSpinning(false)
      setWinner(list[idx])
    }
  }, [drawWheel])

  const spin = () => {
    if (spinning || allDone || teams.length === 0) return
    setWinner(null)
    const extraSpins = (5 + Math.random() * 5) * 2 * Math.PI
    const randomStop = Math.random() * 2 * Math.PI
    targetRotRef.current = currentRotRef.current + extraSpins + randomStop
    startTimeRef.current = null
    setSpinning(true)
    animRef.current = requestAnimationFrame(animate)
  }

  // Redraw when teams change or canvas size changes
  useEffect(() => {
    drawWheel(currentRotRef.current)
  }, [remaining.length, teams.length, canvasSize, drawWheel])

  useEffect(() => () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
  }, [])

  const confirmWinner = () => {
    if (!winner) return
    setSpinOrder(prev => [...prev, winner])
    setWinner(null)
    onTeamSelected?.(winner)
  }

  const confirmReset = () => {
    setSpinOrder([])
    setWinner(null)
    setShowConfirm(false)
    currentRotRef.current = 0
    setTimeout(() => drawWheel(0), 50)
  }

  return (
    <div className="fade-up spin-grid" style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>

      {/* ── Wheel panel ── */}
      <div style={{ background:'#0a1e35', borderRadius:16, border:'1px solid #1e3a5f', overflow:'hidden' }}>
        <div style={{ padding:'13px 18px', borderBottom:'1px solid #1e3a5f', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>🎯</span>
          <span className="teko" style={{ fontSize:20, letterSpacing:1.5, color:'#fff' }}>TEAM SPIN WHEEL</span>
          {allDone && teams.length > 0 && (
            <span style={{ marginLeft:'auto', fontSize:11, color:'#ffb060', fontWeight:700, letterSpacing:1 }}>ALL TEAMS PICKED ✓</span>
          )}
        </div>

        <div style={{ padding:24, display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
          {/* Pointer + canvas */}
          <div style={{ position:'relative', display:'inline-block' }}>
            <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'10px solid transparent', borderRight:'10px solid transparent', borderTop:'20px solid #00c864', zIndex:10, filter:'drop-shadow(0 2px 4px rgba(0,200,100,0.5))' }} />
            <canvas ref={canvasRef} width={canvasSize} height={canvasSize}
              style={{ borderRadius:'50%', display:'block', boxShadow:'0 0 40px rgba(0,0,0,0.6)' }} />
          </div>

          {/* Winner banner */}
          {winner && (
            <div className="slide-in" style={{ background:winner.color+'22', border:`2px solid ${winner.color}`, borderRadius:14, padding:'14px 24px', textAlign:'center', width:'100%' }}>
              <div style={{ fontSize:11, color:'#5a8fba', letterSpacing:2, marginBottom:4, fontWeight:700 }}>SELECTED TEAM</div>
              <div className="teko" style={{ fontSize:28, color:'#fff', letterSpacing:1 }}>{winner.name}</div>
              <button onClick={confirmWinner}
                style={{ marginTop:10, background:`linear-gradient(135deg,${winner.color},${winner.color}cc)`, border:'none', borderRadius:10, padding:'10px 28px', color:winner.accent, fontSize:14, fontWeight:700, fontFamily:"'Teko',sans-serif", letterSpacing:1.5, cursor:'pointer' }}>
                ✓ CONFIRM & ADD TO LIST
              </button>
            </div>
          )}

          {!winner && (
            <button onClick={spin} disabled={spinning || allDone || teams.length === 0}
              style={{ background: allDone||spinning ? '#1e3a5f' : 'linear-gradient(135deg,#00c864,#007a3d)', border:'none', borderRadius:12, padding:'14px 48px', color:'#fff', fontSize:18, fontFamily:"'Teko',sans-serif", letterSpacing:2, cursor: spinning||allDone ? 'not-allowed':'pointer', opacity: spinning||allDone ? 0.6:1, boxShadow: spinning||allDone ? 'none':'0 4px 20px rgba(0,200,100,0.4)', transition:'all .2s' }}>
              {spinning ? '⏳ SPINNING…' : allDone ? '✅ ALL DONE' : '🎯 SPIN'}
            </button>
          )}

          {spinOrder.length > 0 && !winner && (
            <button onClick={() => setShowConfirm(true)}
              style={{ background:'#3a0d0d', border:'1px solid #7f1d1d', borderRadius:10, padding:'8px 24px', color:'#f87171', fontSize:13, fontWeight:700, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='#5a1515'}
              onMouseLeave={e => e.currentTarget.style.background='#3a0d0d'}>
              ↺ Reset Wheel
            </button>
          )}
        </div>
      </div>

      {/* ── Order list ── */}
      <div style={{ background:'#0a1e35', borderRadius:16, border:'1px solid #1e3a5f', overflow:'hidden' }}>
        <div style={{ padding:'13px 16px', borderBottom:'1px solid #1e3a5f', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span className="teko" style={{ fontSize:18, letterSpacing:1.5, color:'#fff' }}>BATTING ORDER</span>
          <span style={{ fontSize:11, color:'#5a8fba', fontWeight:700 }}>{spinOrder.length} / {teams.length}</span>
        </div>

        <div style={{ padding:14 }}>
          {spinOrder.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 10px', color:'#4a7fa8' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🎯</div>
              <div style={{ fontSize:13, fontWeight:600 }}>Spin the wheel to pick teams</div>
              <div style={{ fontSize:11, marginTop:4, color:'#2a4a6f', fontWeight:600 }}>They'll appear here in order</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {spinOrder.map((team, idx) => (
                <div key={team.id} className="slide-in"
                  style={{ background:'#08111e', border:`1px solid ${team.color}44`, borderLeft:`3px solid ${team.color}`, borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:team.color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Teko',sans-serif", fontSize:16, color:team.accent, fontWeight:800, flexShrink:0 }}>
                    {idx + 1}
                  </div>
                  <div style={{ width:32, height:32, borderRadius:8, background:team.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:team.accent, fontWeight:800, flexShrink:0 }}>
                    {team.short}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, color:'#fff', fontWeight:700 }}>{team.name}</div>
                    <div style={{ fontSize:10, color:'#5a8fba', marginTop:1, fontWeight:700 }}>Pick #{idx + 1}</div>
                  </div>
                  {idx === spinOrder.length - 1 && (
                    <span style={{ fontSize:10, color:'#00c864', fontWeight:700, letterSpacing:1 }}>LATEST</span>
                  )}
                </div>
              ))}
              {remaining.map((_, idx) => (
                <div key={idx} style={{ background:'#08111e', border:'1px dashed #1e3a5f', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:12, opacity:0.4 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Teko',sans-serif", fontSize:16, color:'#4a7fa8' }}>
                    {spinOrder.length + idx + 1}
                  </div>
                  <div style={{ fontSize:13, color:'#3a6a8f', fontWeight:600 }}>Waiting to be picked…</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset confirm modal */}
      {showConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.78)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }}
          onClick={() => setShowConfirm(false)}>
          <div className="slide-in mob-modal" onClick={e => e.stopPropagation()}
            style={{ background:'#0a1e35', border:'1px solid #1e3a5f', borderRadius:16, padding:28, maxWidth:360, width:'92%', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🔄</div>
            <div className="teko" style={{ fontSize:24, color:'#fff', marginBottom:8 }}>Reset Wheel?</div>
            <div style={{ color:'#8ab4d8', fontSize:14, lineHeight:1.6, marginBottom:22, fontWeight:600 }}>
              This will clear the entire team order list and start fresh. Are you sure?
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setShowConfirm(false)}
                style={{ background:'#1e3a5f', border:'none', borderRadius:8, padding:'10px 22px', color:'#8ab4d8', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmReset}
                style={{ background:'#b91c1c', border:'none', borderRadius:8, padding:'10px 22px', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}