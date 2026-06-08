// src/components/SubtitleDisplay.tsx

import { useEffect, useState } from 'react'
import type { Message } from '../types'

interface SubtitleDisplayProps {
  currentMessage: Message | null
  isStreaming?: boolean
}

export function SubtitleDisplay({ currentMessage, isStreaming = false }: SubtitleDisplayProps) {
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    if (!currentMessage) {
      setDisplayText('')
      return
    }

    if (!isStreaming) {
      setDisplayText(currentMessage.content)
      return
    }

    // Typewriter effect
    setDisplayText('')
    let index = 0
    const text = currentMessage.content

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [currentMessage, isStreaming])

  if (!currentMessage) {
    return null
  }

  return (
    <div
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
