// src/components/FloatingWindow/WindowManager.tsx

import { WindowRenderer } from './WindowRenderer'
import type { WindowState } from '../../hooks/useWindowManager'

interface WindowManagerProps {
  windows: Map<string, WindowState>
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onMaximize: (id: string) => void
  onFocus: (id: string) => void
  onMove: (id: string, col: number, row: number) => void
  onResize: (id: string, width: number, height: number) => void
}

export function WindowManager({
  windows,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
}: WindowManagerProps) {
  const allWindows = Array.from(windows.values())

  return (
    <>
      {allWindows.map((win) => {
        return (
          <WindowRenderer
            key={win.id}
            window={win}
            onClose={() => onClose(win.id)}
            onMinimize={() => onMinimize(win.id)}
            onMaximize={() => onMaximize(win.id)}
            onFocus={() => onFocus(win.id)}
            onMove={(col, row) => onMove(win.id, col, row)}
            onResize={(width, height) => onResize(win.id, width, height)}
          />
        )
      })}
    </>
  )
}
