// src/components/ConfirmModal.jsx

export default function ConfirmModal({ player, onConfirm, onCancel }) {
  if (!player) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onCancel}
    >
      <div
        className="slide-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a1e35',
          border: '1px solid #1e3a5f',
          borderRadius: 16,
          padding: 28,
          maxWidth: 360,
          width: '92%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>↩</div>
        <div className="teko" style={{ fontSize: 22, color: '#fff', marginBottom: 8 }}>
          Release Player?
        </div>
        <div style={{ color: '#7ab4d8', marginBottom: 22, fontSize: 14, lineHeight: 1.6 }}>
          <strong style={{ color: '#fff' }}>{player.name}</strong> will be returned to the player
          pool and become available for re-auction.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              background: '#1e3a5f', border: 'none', borderRadius: 8,
              padding: '10px 22px', color: '#7ab4d8', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(player.id)}
            style={{
              background: '#b91c1c', border: 'none', borderRadius: 8,
              padding: '10px 22px', color: '#fff', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Yes, Release
          </button>
        </div>
      </div>
    </div>
  )
}
