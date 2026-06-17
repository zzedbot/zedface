// src/components/HistoryPanel.tsx

import { useEffect, useRef } from 'react'
import type { Message } from '../types'

interface HistoryPanelProps {
  isOpen: boolean
  messages: Message[]
  onClose: () => void
}

export function HistoryPanel({ isOpen, messages, onClose }: HistoryPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape 键关闭 + 焦点陷阱
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // 焦点陷阱
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>('button, [tabindex]')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // 自动聚焦关闭按钮
    setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button')?.focus(), 50)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 z-20"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="历史对话"
        className="fixed top-0 right-0 w-full max-w-[400px] h-screen bg-gradient-to-b from-[#1a0a2e] to-[#302b63] border-l border-primary/20 shadow-[-5px_0_30px_rgba(0,0,0,0.5)] z-[21] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary">历史对话</h2>
          <button
            onClick={onClose}
            aria-label="关闭历史对话"
            className="text-xl text-text-secondary p-1 px-2 transition-colors hover:text-primary"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="text-center text-text-secondary mt-10">暂无历史对话</div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`glass-panel p-3 ${
                    msg.role === 'assistant'
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-secondary/5 border-secondary/20'
                  }`}
                >
                  <div
                    className={`text-[11px] mb-1.5 opacity-80 ${
                      msg.role === 'assistant' ? 'text-primary' : 'text-secondary'
                    }`}
                  >
                    {msg.role === 'assistant' ? 'Zed' : '你'}
                  </div>
                  <div className="text-sm text-text-primary leading-relaxed">
                    {msg.content}
                  </div>
                  <div className="text-[10px] text-text-secondary/70 mt-2">
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
