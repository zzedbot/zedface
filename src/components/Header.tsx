// src/components/Header.tsx

import { StateRegistry } from '../zed/states'
import type { ZedState } from '../types'

interface HeaderProps {
  zedState: ZedState
}

export function Header({ zedState }: HeaderProps) {
  const behavior = StateRegistry.get(zedState)
  const statusText = behavior?.label ?? zedState
  const statusColor = behavior?.color ?? '#4ecdc4'

  return (
    <header
      role="banner"
      className="absolute top-0 left-0 right-0 flex justify-center items-center py-4 px-6 z-10"
    >
      <div
        className="text-2xl font-bold tracking-[2px]"
        style={{
          background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Zed
      </div>

      <div
        role="status"
        aria-label={`当前状态：${statusText}`}
        className="absolute right-6 flex items-center gap-2"
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
            animation: zedState !== 'idle' ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        <span className="text-xs text-text-secondary">{statusText}</span>
      </div>
    </header>
  )
}
