// src/components/TextInput.tsx

import { useState } from 'react'

interface TextInputProps {
  isOpen: boolean
  onSubmit: (text: string) => void
  onClose: () => void
  isLoading: boolean
}

export function TextInput({ isOpen, onSubmit, onClose, isLoading }: TextInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !isLoading) {
      onSubmit(text.trim())
      setText('')
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
        className="glass-panel"
        style={{
          display: 'flex',
          gap: '12px',
          padding: '12px',
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入消息..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(78, 205, 196, 0.2)',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#e0e0ff',
            fontSize: '14px',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.5)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.2)'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
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
      </form>
    </div>
  )
}
