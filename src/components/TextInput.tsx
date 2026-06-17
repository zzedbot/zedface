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
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] z-15">
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="glass-panel flex flex-col gap-2 p-3"
      >
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入消息..."
            disabled={isLoading}
            maxLength={2000}
            aria-label="消息输入"
            className={`flex-1 bg-black/30 rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none transition-colors ${
              error ? 'border border-secondary/50' : 'border border-primary/20'
            }`}
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            aria-label="发送消息"
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-br from-primary to-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            发送
          </button>
        </div>
        {error && <div className="text-[11px] text-secondary pl-1">{error}</div>}
      </form>
    </div>
  )
}
