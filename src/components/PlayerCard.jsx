// src/components/PlayerCard.jsx

import { ROLE_COLORS } from '../lib/constants'

export default function PlayerCard({ player, onClick, isSelected, compact = false }) {
  return (
    <div
      className={`pcard ${isSelected ? 'on-stage' : ''}`}
      onClick={onClick}
      style={{
        background: isSelected ? '#0d2848' : '#08111e',
        border: '1px solid #1e3a5f',
        borderRadius: compact ? 10 : 12,
        padding: compact ? 11 : 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: compact ? 13 : 15,
            color: '#e8edf5',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {player.name}
          </div>
          <span
            className="badge"
            style={{
              marginTop: 5,
              display: 'inline-block',
              background: ROLE_COLORS[player.role]?.bg,
              color: ROLE_COLORS[player.role]?.text,
              fontSize: compact ? 9 : 10,
            }}
          >
            {player.role}
          </span>
        </div>
        <div style={{
          fontFamily: "'Teko', sans-serif",
          fontSize: compact ? 22 : 26,
          color: '#00c864',
          marginLeft: 10,
          flexShrink: 0,
          lineHeight: 1,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: compact ? 9 : 10, color: '#4a7fa8', letterSpacing: 1 }}>RTG</div>
          {player.rating}
        </div>
      </div>
    </div>
  )
}
