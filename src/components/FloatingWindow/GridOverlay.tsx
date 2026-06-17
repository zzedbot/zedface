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
    <div className="fixed inset-0 pointer-events-none z-[45]">
      {/* 网格线 */}
      <svg className="absolute top-0 left-0 w-full h-full">
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
            className="absolute bg-primary/8 border-2 border-primary/40 rounded-lg transition-all duration-[50ms] ease-out"
            style={{
              left: `${highlightCol * cellWidth}%`,
              top: `${highlightRow * cellHeight}%`,
              width: `${highlightWidth * cellWidth}%`,
              height: `${highlightHeight * cellHeight}%`,
            }}
          />
        )}
    </div>
  )
}
