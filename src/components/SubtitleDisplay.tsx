// src/components/SubtitleDisplay.tsx

import { useEffect, useState, useRef } from 'react'
import type { Message } from '../types'

interface SubtitleDisplayProps {
  currentMessage: Message | null
  isStreaming?: boolean
}

export function SubtitleDisplay({ currentMessage, isStreaming = false }: SubtitleDisplayProps) {
  const [displayText, setDisplayText] = useState('')
  const prevContentRef = useRef('')
  const messageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!currentMessage) {
      setDisplayText('')
      prevContentRef.current = ''
      messageIdRef.current = null
      return
    }

    // 新消息（ID 变化）：重置打字机
    if (messageIdRef.current !== currentMessage.id) {
      messageIdRef.current = currentMessage.id
      prevContentRef.current = ''
      setDisplayText('')
    }

    if (!isStreaming) {
      // 非流式：直接显示完整内容
      setDisplayText(currentMessage.content)
      prevContentRef.current = currentMessage.content
      return
    }

    // 流式：仅对新增字符执行打字机效果
    const prevLen = prevContentRef.current.length
    const fullText = currentMessage.content

    if (fullText.length <= prevLen) {
      // 内容没有增长，不做任何事
      return
    }

    // 先显示已有的前缀
    const prefix = fullText.slice(0, prevLen)
    const newText = fullText.slice(prevLen)
    setDisplayText(prefix)

    let index = 0
    const interval = setInterval(() => {
      if (index < newText.length) {
        setDisplayText(prefix + newText.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
        prevContentRef.current = fullText
      }
    }, 30)

    return () => clearInterval(interval)
  }, [currentMessage, isStreaming])

  if (!currentMessage) {
    return null
  }

  return (
    <div
      role="log"
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'absolute',
        bottom: '100px',
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '0 40px',
        zIndex: 5,
      }}
    >
      <div
        className="glass-panel"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          maxWidth: '600px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: currentMessage.role === 'assistant' ? '#4ecdc4' : '#ff6b6b',
            marginBottom: '4px',
            opacity: 0.7,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {currentMessage.role === 'assistant' ? 'Zed' : '你'}
        </div>
        <div
          style={{
            fontSize: '16px',
            color: '#e0e0ff',
            lineHeight: 1.6,
          }}
        >
          {displayText}
          {isStreaming && <span style={{ opacity: 0.5 }}>▊</span>}
        </div>
      </div>
    </div>
  )
}
