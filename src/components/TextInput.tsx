// src/components/TextInput.tsx

import { useState, useRef, useEffect } from 'react'

interface TextInputProps {
  isOpen: boolean
  onSubmit: (text: string) => void
  onClose: () => void
  isLoading: boolean
}

export function TextInput({ isOpen, onSubmit, onClose, isLoading }: TextInputProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 打开时自动聚焦
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || isLoading) return

    setError(null)
    try {
      await onSubmit(text.trim())
      setText('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '600px',
        zIndex: 15,
      }}
    >
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="glass-panel"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入消息..."
            disabled={isLoading}
            maxLength={2000}
            aria-label="消息输入"
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${error ? 'rgba(255, 107, 107, 0.5)' : 'rgba(78, 205, 196, 0.2)'}`,
              borderRadius: '8px',
              padding: '10px 16px',
              color: '#e0e0ff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            aria-label="发送消息"
            style={{
              background: 'linear-gradient(135deg, #4ecdc4, #ff6b6b)',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isLoading || !text.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !text.trim() ? 0.5 : 1,
            }}
          >
            发送
          </button>
        </div>
        {error && <div style={{ fontSize: '11px', color: '#ff6b6b', paddingLeft: '4px' }}>{error}</div>}
      </form>
    </div>
  )
}
