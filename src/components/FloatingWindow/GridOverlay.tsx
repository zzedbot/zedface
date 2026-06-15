// src/components/FloatingWindow/GridOverlay.tsx

interface GridOverlayProps {
  gridCols: number
  gridRows: number
  // 当前窗口占据的格位（用于高亮）
  highlightCol?: number
  highlightRow?: number
  highlightWidth?: number
  highlightHeight?: number
}

export function GridOverlay({
  gridCols,
  gridRows,
  highlightCol,
  highlightRow,
  highlightWidth,
  highlightHeight,
}: GridOverlayProps) {
  const cellWidth = 100 / gridCols
  const cellHeight = 100 / gridRows

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 45,
      }}
    >
      {/* 网格线 */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* 垂直线 */}
        {Array.from({ length: gridCols + 1 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={`${i * cellWidth}%`}
            y1="0"
            x2={`${i * cellWidth}%`}
            y2="100%"
            stroke="rgba(78, 205, 196, 0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        {/* 水平线 */}
        {Array.from({ length: gridRows + 1 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={`${i * cellHeight}%`}
            x2="100%"
            y2={`${i * cellHeight}%`}
            stroke="rgba(78, 205, 196, 0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
      </svg>

      {/* 高亮当前窗口占据的区域 */}
      {highlightCol !== undefined &&
        highlightRow !== undefined &&
        highlightWidth !== undefined &&
        highlightHeight !== undefined && (
          <div
            style={{
              position: 'absolute',
              left: `${highlightCol * cellWidth}%`,
              top: `${highlightRow * cellHeight}%`,
              width: `${highlightWidth * cellWidth}%`,
              height: `${highlightHeight * cellHeight}%`,
              background: 'rgba(78, 205, 196, 0.08)',
              border: '2px solid rgba(78, 205, 196, 0.4)',
              borderRadius: '8px',
              transition: 'all 0.05s ease-out',
            }}
          />
        )}
    </div>
  )
}
