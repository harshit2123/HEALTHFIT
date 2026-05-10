import { useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

/**
 * Bottom sheet for mobile (slides from bottom).
 * On desktop, falls back to centered modal via media query.
 */
export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Escape key
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
        background: 'rgba(0,0,0,0.4)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
          animation: 'slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            padding: '0.75rem 0 0.5rem',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '4px',
              background: '#d4d4d8',
              borderRadius: '999px',
            }}
          />
        </div>
        {title && (
          <h3
            style={{
              margin: '0 1.5rem 0.75rem',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            {title}
          </h3>
        )}
        <div style={{ padding: '0 1.5rem 1.5rem' }}>{children}</div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
