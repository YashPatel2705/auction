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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
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
        </div>
        <div style={{
          fontFamily: "'Teko', sans-serif",
          fontSize: compact ? 20 : 24,
          color: '#00c864',
          marginLeft: 8,
          flexShrink: 0,
          lineHeight: 1,
        }}>
          {player.rating}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          className="badge"
          style={{
            background: ROLE_COLORS[player.role]?.bg,
            color: ROLE_COLORS[player.role]?.text,
            fontSize: compact ? 9 : 10,
          }}
        >
          {player.role}
        </span>
        <span style={{
          fontFamily: "'Teko', sans-serif",
          fontSize: compact ? 13 : 15,
          color: '#ffb060',
        }}>
          ₹{player.basePrice}L
        </span>
      </div>
    </div>
  )
}
