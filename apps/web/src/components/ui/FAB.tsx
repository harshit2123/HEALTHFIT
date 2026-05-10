interface FABProps {
  onClick: () => void
  label?: string
}

/**
 * Floating Action Button. Cal AI / Material pattern.
 * Always visible bottom-right. Above bottom tab nav on mobile.
 */
export function FAB({ onClick, label = 'Quick add' }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        position: 'fixed',
        bottom: 'calc(72px + env(safe-area-inset-bottom, 0))', // sits above bottom tabs (56px) + 16px gap
        right: '1rem',
        width: '56px',
        height: '56px',
        borderRadius: '999px',
        background: '#10b981',
        color: 'white',
        border: 'none',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
        cursor: 'pointer',
        fontSize: '1.75rem',
        fontWeight: 300,
        lineHeight: 1,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      +
    </button>
  )
}
