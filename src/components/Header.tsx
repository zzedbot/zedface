// src/components/Header.tsx

import type { ZedState } from '../types'

interface HeaderProps {
  zedState: ZedState
}

export function Header({ zedState }: HeaderProps) {
  const getStatusText = () => {
    switch (zedState) {
      case 'listening':
        return '聆听中'
      case 'thinking':
        return '思考中'
      case 'speaking':
        return '回应中'
      default:
        return '在线'
    }
  }

  const getStatusColor = () => {
    switch (zedState) {
      case 'listening':
        return '#ff6b6b'
      case 'thinking':
        return '#ffd93d'
      case 'speaking':
        return '#4ecdc4'
      default:
        return '#4ecdc4'
    }
  }

  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
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
            background: getStatusColor(),
            boxShadow: `0 0 8px ${getStatusColor()}`,
            animation: zedState !== 'idle' ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        <span style={{ fontSize: '12px', color: '#888' }}>
          {getStatusText()}
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  )
}
