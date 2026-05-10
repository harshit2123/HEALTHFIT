import { useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 200ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="sf-glass-strong"
        style={{
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderTop: '1px solid rgba(0,255,46,0.14)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,255,46,0.06)',
          animation: 'sheetUp 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Handle */}
        <div style={{
          padding: '12px 0 6px',
          display: 'flex',
          justifyContent: 'center',
          cursor: 'pointer',
        }} onClick={onClose}>
          <div style={{
            width: '40px',
            height: '4px',
            background: 'rgba(0,255,46,0.20)',
            borderRadius: '100px',
          }} />
        </div>

        {title && (
          <div style={{
            padding: '4px 20px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
            }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-muted)',
                border: '1px solid var(--neon-border)',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        <div className="sf-divider" style={{ margin: '0 20px' }} />

        <div style={{ padding: '16px 20px calc(20px + env(safe-area-inset-bottom, 0px))' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes sheetUp {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
