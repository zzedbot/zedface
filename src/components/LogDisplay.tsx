// src/components/LogDisplay.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { logger } from '../utils/Logger'
import { FloatingWindow } from './FloatingWindow'

export function LogDisplay() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
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
        onClick={() => {
          setIsVisible(true)
          setIsMinimized(false)
        }}
        aria-label="显示调试日志"
        className="fixed bottom-2.5 right-2.5 px-4 py-2 bg-primary/20 border border-primary/40 rounded text-primary text-xs z-[1000] transition-colors hover:bg-primary/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
      >
        显示日志
      </button>
    )
  }

  return (
    <FloatingWindow
      title="调试日志"
      windowId="log-display"
      isOpen={isVisible}
      isMinimized={isMinimized}
      onClose={() => setIsVisible(false)}
      onMinimize={() => setIsMinimized(!isMinimized)}
      initialCol={7}
      initialRow={2}
      initialWidth={5}
      initialHeight={6}
      minWidth={4}
      minHeight={3}
    >
      <div className="flex flex-col h-full">
        {/* 操作按钮 */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleCopy}
            aria-label="复制全部日志"
            className="px-3 py-1.5 bg-primary/20 border border-primary/40 rounded text-primary text-xs transition-colors hover:bg-primary/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
          >
            {copyStatus === 'ok' ? '已复制 ✓' : copyStatus === 'fail' ? '失败' : '复制全部'}
          </button>
          <button
            onClick={() => logger.clear()}
            aria-label="清空日志"
            className="px-3 py-1.5 bg-secondary/20 border border-secondary/40 rounded text-secondary text-xs transition-colors hover:bg-secondary/30 focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
          >
            清空
          </button>
        </div>

        {/* 日志内容 */}
        <textarea
          ref={textareaRef}
          readOnly
          defaultValue={logger.getLogs()}
          className="flex-1 w-full bg-black/50 border border-primary/20 rounded p-3 text-primary text-xs font-mono resize-none focus:outline-none focus:border-primary/50"
        />
      </div>
    </FloatingWindow>
  )
}
