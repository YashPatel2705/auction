// src/components/Toast.jsx

export default function Toast({ toast }) {
  if (!toast) return null
  const isError = toast.type === 'error'
  return (
    <div
      className="toast-wrap"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 3000,
        background: isError ? '#3a0d0d' : '#071a0f',
        border: `1px solid ${isError ? '#ef4444' : '#00c864'}`,
        borderRadius: 12, padding: '13px 18px', maxWidth: 380,
        boxShadow: `0 8px 32px ${isError ? 'rgba(239,68,68,.3)' : 'rgba(0,200,100,.25)'}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <span style={{ fontSize: 18 }}>{isError ? '⚠️' : '✅'}</span>
      <span style={{ fontSize: 14, color: '#e8edf5', fontWeight: 600 }}>{toast.msg}</span>
    </div>
  )
}
