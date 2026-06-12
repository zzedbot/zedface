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
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px 24px',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '24px',
          fontWeight: 'bold',
          letterSpacing: '2px',
        }}
      >
        Zed
      </div>

      <div
        role="status"
        aria-label={`当前状态: ${statusText}`}
        style={{
          position: 'absolute',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
            animation: zedState !== 'idle' ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        <span style={{ fontSize: '12px', color: '#888' }}>{statusText}</span>
      </div>
    </header>
  )
}
