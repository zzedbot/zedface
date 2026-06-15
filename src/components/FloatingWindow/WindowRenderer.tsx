// src/components/FloatingWindow/WindowRenderer.tsx

import { FloatingWindow } from './FloatingWindow'
import { WindowContentRenderer } from './WindowContent'
import type { WindowState } from '../../hooks/useWindowManager'

interface WindowRendererProps {
  window: WindowState
  minimizedIndex: number
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onFocus: () => void
  onMove: (col: number, row: number) => void
  onResize: (width: number, height: number) => void
}

export function WindowRenderer({
  window: win,
  minimizedIndex,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
}: WindowRendererProps) {
  if (!win.isOpen) return null

  return (
    <FloatingWindow
      title={win.title}
      isOpen={win.isOpen}
      isMinimized={win.isMinimized}
      isMaximized={win.isMaximized}
      minimizedIndex={minimizedIndex}
      zIndex={win.zIndex}
      initialCol={win.col}
      initialRow={win.row}
      initialWidth={win.width}
      initialHeight={win.height}
      onClose={onClose}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      onFocus={onFocus}
      onPositionChange={onMove}
      onSizeChange={onResize}
    >
      {win.content ? (
        <WindowContentRenderer content={win.content} />
      ) : (
        <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
          No content
        </div>
      )}
    </FloatingWindow>
  )
}
