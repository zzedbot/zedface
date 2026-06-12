// src/components/LogDisplay.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { logger } from '../utils/Logger'

export function LogDisplay() {
  const [isVisible, setIsVisible] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'ok' | 'fail'>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 追加日志到 textarea（避免整页重渲染）
  useEffect(() => {
    if (!isVisible) return
    const unsubscribe = logger.subscribe(() => {
      if (textareaRef.current) {
        textareaRef.current.value = logger.getLogs()
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight
      }
    })
    // 初始填充
    if (textareaRef.current) {
      textareaRef.current.value = logger.getLogs()
    }
    return unsubscribe
  }, [isVisible])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(logger.getLogs())
      setCopyStatus('ok')
    } catch {
      // fallback: select all text in textarea
      if (textareaRef.current) {
        textareaRef.current.select()
        document.execCommand('copy')
      }
      setCopyStatus('fail')
    }
    setTimeout(() => setCopyStatus('idle'), 2000)
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        aria-label="显示调试日志"
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '8px 16px',
          background: 'rgba(78, 205, 196, 0.2)',
          border: '1px solid rgba(78, 205, 196, 0.4)',
          borderRadius: '4px',
          color: '#4ecdc4',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        显示日志
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: 'min(800px, calc(100vw - 20px))',
        height: '80vh',
        background: 'rgba(0, 0, 0, 0.9)',
        border: '1px solid rgba(78, 205, 196, 0.4)',
        borderRadius: '4px',
        padding: '10px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ color: '#4ecdc4', fontSize: '14px' }}>调试日志</span>
        <div>
          <button
            onClick={handleCopy}
            aria-label="复制全部日志"
            style={{
              padding: '4px 8px',
              background: 'rgba(78, 205, 196, 0.2)',
              border: '1px solid rgba(78, 205, 196, 0.4)',
              borderRadius: '4px',
              color: copyStatus === 'ok' ? '#4ecdc4' : '#4ecdc4',
              fontSize: '11px',
              cursor: 'pointer',
              marginRight: '5px',
            }}
          >
            {copyStatus === 'ok' ? '已复制 ✓' : copyStatus === 'fail' ? '失败' : '复制全部'}
          </button>
          <button
            onClick={() => logger.clear()}
            aria-label="清空日志"
            style={{
              padding: '4px 8px',
              background: 'rgba(255, 107, 107, 0.2)',
              border: '1px solid rgba(255, 107, 107, 0.4)',
              borderRadius: '4px',
              color: '#ff6b6b',
              fontSize: '11px',
              cursor: 'pointer',
              marginRight: '5px',
            }}
          >
            清空
          </button>
          <button
            onClick={() => setIsVisible(false)}
            aria-label="隐藏日志"
            style={{
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: '#888',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            隐藏
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        readOnly
        defaultValue={logger.getLogs()}
        style={{
          flex: 1,
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(78, 205, 196, 0.2)',
          borderRadius: '4px',
          padding: '8px',
          color: '#4ecdc4',
          fontSize: '11px',
          fontFamily: 'monospace',
          resize: 'none',
          overflowY: 'auto',
        }}
      />
    </div>
  )
}
