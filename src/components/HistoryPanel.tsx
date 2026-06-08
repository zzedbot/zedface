// src/components/HistoryPanel.tsx

import type { Message } from '../types'

interface HistoryPanelProps {
  isOpen: boolean
  messages: Message[]
  onClose: () => void
}

export function HistoryPanel({ isOpen, messages, onClose }: HistoryPanelProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 20,
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-400px',
          width: '400px',
          height: '100vh',
          background: 'linear-gradient(180deg, #1a0a2e, #302b63)',
          borderLeft: '1px solid rgba(78, 205, 196, 0.2)',
          boxShadow: '-5px 0 30px rgba(0, 0, 0, 0.5)',
          transition: 'right 0.3s ease',
          zIndex: 21,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#4ecdc4',
            }}
          >
            历史对话
          </h2>
          <button
            onClick={onClose}
            style={{
              fontSize: '20px',
              color: '#888',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: '#888',
                marginTop: '40px',
              }}
            >
              暂无历史对话
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="glass-panel"
                  style={{
                    padding: '12px',
                    background:
                      msg.role === 'assistant'
                        ? 'rgba(78, 205, 196, 0.05)'
                        : 'rgba(255, 107, 107, 0.05)',
                    borderColor:
                      msg.role === 'assistant'
                        ? 'rgba(78, 205, 196, 0.2)'
                        : 'rgba(255, 107, 107, 0.2)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: msg.role === 'assistant' ? '#4ecdc4' : '#ff6b6b',
                      marginBottom: '6px',
                      opacity: 0.8,
                    }}
                  >
                    {msg.role === 'assistant' ? 'Zed' : '你'}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#e0e0ff',
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.content}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '8px',
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
