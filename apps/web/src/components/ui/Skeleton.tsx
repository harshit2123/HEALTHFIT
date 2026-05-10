interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  count?: number
  gap?: string
}

/**
 * Lightweight loading skeleton. Compositor-friendly (opacity only).
 * Use over spinners — better perceived perf, lower CLS.
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '6px',
  count = 1,
  gap = '0.5rem',
}: SkeletonProps) {
  if (count > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              width,
              height,
              borderRadius,
              background: '#f3f4f6',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`
          @keyframes skeleton-pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          width,
          height,
          borderRadius,
          background: '#f3f4f6',
          animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes skeleton-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  )
}
