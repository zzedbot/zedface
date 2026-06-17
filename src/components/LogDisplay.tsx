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
        textareaRef.current.scrollTop = textareaRef.scrollHeight
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
        className="fixed bottom-2.5 right-2.5 px-4 py-2 bg-primary/20 border border-primary/40 rounded text-primary text-xs z-[1000] transition-colors hover:bg-primary/30"
      >
        显示日志
      </button>
    )
  }

  return (
    <div className="fixed bottom-2.5 right-2.5 w-[min(800px,calc(100vw-20px))] h-[80vh] bg-black/90 border border-primary/40 rounded p-2.5 z-[1000] flex flex-col">
      <div className="flex justify-between mb-2.5">
        <span className="text-primary text-sm">调试日志</span>
        <div>
          <button
            onClick={handleCopy}
            aria-label="复制全部日志"
            className="px-2 py-1 bg-primary/20 border border-primary/40 rounded text-primary text-[11px] mr-[5px] transition-colors hover:bg-primary/30"
          >
            {copyStatus === 'ok' ? '已复制 ✓' : copyStatus === 'fail' ? '失败' : '复制全部'}
          </button>
          <button
            onClick={() => logger.clear()}
            aria-label="清空日志"
            className="px-2 py-1 bg-secondary/20 border border-secondary/40 rounded text-secondary text-[11px] mr-[5px] transition-colors hover:bg-secondary/30"
          >
            清空
          </button>
          <button
            onClick={() => setIsVisible(false)}
            aria-label="隐藏日志"
            className="px-2 py-1 bg-white/10 border border-white/20 rounded text-text-secondary text-[11px] transition-colors hover:bg-white/20"
          >
            隐藏
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        readOnly
        defaultValue={logger.getLogs()}
        className="flex-1 bg-black/50 border border-primary/20 rounded p-2 text-primary text-[11px] font-mono resize-none overflow-y-auto"
      />
    </div>
  )
}
