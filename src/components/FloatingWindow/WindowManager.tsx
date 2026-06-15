// src/components/FloatingWindow/WindowManager.tsx

import { WindowRenderer } from './WindowRenderer'
import type { WindowState } from '../../hooks/useWindowManager'

interface WindowManagerProps {
  windows: Map<string, WindowState>
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onMove: (id: string, col: number, row: number) => void
  onResize: (id: string, width: number, height: number) => void
}

export function WindowManager({
  windows,
  onClose,
  onMinimize,
  onMove,
  onResize,
}: WindowManagerProps) {
  return (
    <>
      {Array.from(windows.values()).map((win) => (
        <WindowRenderer
          key={win.id}
          window={win}
          onClose={() => onClose(win.id)}
          onMinimize={() => onMinimize(win.id)}
          onMove={(col, row) => onMove(win.id, col, row)}
          onResize={(width, height) => onResize(win.id, width, height)}
        />
      ))}
    </>
  )
}
