// src/App.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { Header } from './components/Header'
import { SubtitleDisplay } from './components/SubtitleDisplay'
import { ControlBar } from './components/ControlBar'
import { ControlPanel } from './components/ControlPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { TextInput } from './components/TextInput'
import { ZedAvatar } from './zed/ZedAvatar'
import { StateRegistry } from './zed/states'
import './zed/states' // 触发状态注册
import { useChat } from './hooks/useChat'
import { useVoiceRecorder } from './voice/useVoiceRecorder'
import { useAudioAnalyser } from './voice/useAudioAnalyser'
import { useWhisper } from './voice/useWhisper'
import { useKokoro } from './voice/useKokoro'
import { useControlSocket } from './hooks/useControlSocket'
import { useWindowManager } from './hooks/useWindowManager'
import { LogDisplay } from './components/LogDisplay'
import { WindowManager } from './components/FloatingWindow'
import type { ZedState, FluidParams } from './types'

function App() {
  const { messages, isLoading, sendUserMessage, setListening } = useChat()
  const { isRecording, audioBlob, mediaStream, startRecording, stopRecording, releaseStream } = useVoiceRecorder()
  const frequencyData = useAudioAnalyser(isRecording ? mediaStream : null)
  const { transcribe } = useWhisper()
  const { isSpeaking, speak, audioRef } = useKokoro()
  const windowManager = useWindowManager()

  // 获取状态预设的辅助函数
  const getPreset = (stateId: string) => StateRegistry.get(stateId)?.preset ?? StateRegistry.get('idle')!.preset

  const [showHistory, setShowHistory] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [fluidParams, setFluidParams] = useState<FluidParams>(getPreset('intro'))
  const [usePreset, setUsePreset] = useState(true) // 默认使用状态预设模式
  const [debugState, setDebugState] = useState<ZedState | null>(null) // null = auto-state
  const [showContent, setShowContent] = useState<{
    type: 'text' | 'emoji' | 'image' | 'shape'
    content: string
    options?: any
  } | null>(null)

  const currentMessage = messages.length > 0 ? messages[messages.length - 1] : null
  const prevMessageCountRef = useRef(messages.length)
  const audioBlobRef = useRef(audioBlob)
  const spokenMessageIdRef = useRef<string | null>(null)
  const showEndTimerRef = useRef<number | null>(null)
  useEffect(() => { audioBlobRef.current = audioBlob }, [audioBlob])

  // WebSocket 控制回调
  const handleControlStateChange = useCallback((state: ZedState) => {
    console.log('[App] Control: setState', state)
    setDebugState(state)
    setFluidParams(getPreset(state))
  }, [])

  const handleControlParamsChange = useCallback((params: Partial<FluidParams>) => {
    console.log('[App] Control: setParams', params)
    setFluidParams(prev => ({ ...prev, ...params }))
  }, [])

  const handleShow = useCallback((type: 'text' | 'emoji' | 'image' | 'shape', content: string, options?: any) => {
    console.log('[App] Control: show', type, content)
    setDebugState('show')
    setFluidParams(getPreset('show'))
    setShowContent({ type, content, options })
  }, [])

  const handleShowEnd = useCallback(() => {
    console.log('[App] Control: showEnd')
    // 取消上一个 timer（防止竞态）
    if (showEndTimerRef.current !== null) {
      clearTimeout(showEndTimerRef.current)
    }
    setShowContent(null)

    // 等待 ShowState 退出过渡完成后切 idle
    // lerp 收敛到 95% 所需时间 = -ln(20) / (fps * ln(1-ts))
    // ts=0.1 → ~0.49s, ts=0.08 → ~0.61s, 加 100ms 余量
    const showTs = getPreset('show').transitionSpeed ?? 0.08
    const convergeSec = -Math.log(20) / (60 * Math.log(1 - showTs))
    const waitMs = Math.max(400, Math.round((convergeSec + 0.1) * 1000))

    showEndTimerRef.current = window.setTimeout(() => {
      console.log('[App] Control: showEnd - switching to idle')
      setDebugState(null)
      setFluidParams(getPreset('idle'))
      showEndTimerRef.current = null
    }, waitMs)
  }, [])

  const handleCancelShow = useCallback(() => {
    console.log('[App] Control: cancelShow')
    // 清除残留的 showEnd timer（防止竞态）
    if (showEndTimerRef.current !== null) {
      clearTimeout(showEndTimerRef.current)
      showEndTimerRef.current = null
    }
    setShowContent(null)
    // 保持 show 状态的参数，不恢复到 idle
  }, [])

  // 窗口控制回调
  const handleWindowOpen = useCallback((windowId: string, title: string, options: { col?: number; row?: number; width?: number; height?: number }) => {
    console.log('[App] Control: windowOpen', windowId, title, options)
    windowManager.openWindow(windowId, { ...options, title })
  }, [windowManager])

  const handleWindowClose = useCallback((windowId: string) => {
    console.log('[App] Control: windowClose', windowId)
    windowManager.closeWindow(windowId)
  }, [windowManager])

  const handleWindowMinimize = useCallback((windowId: string, minimized?: boolean) => {
    console.log('[App] Control: windowMinimize', windowId, minimized)
    windowManager.minimizeWindow(windowId, minimized)
  }, [windowManager])

  const handleWindowMaximize = useCallback((windowId: string) => {
    console.log('[App] Control: windowMaximize', windowId)
    windowManager.maximizeWindow(windowId)
  }, [windowManager])

  const handleWindowMove = useCallback((windowId: string, col: number, row: number) => {
    console.log('[App] Control: windowMove', windowId, col, row)
    windowManager.moveWindow(windowId, col, row)
  }, [windowManager])

  const handleWindowResize = useCallback((windowId: string, width: number, height: number) => {
    console.log('[App] Control: windowResize', windowId, width, height)
    windowManager.resizeWindow(windowId, width, height)
  }, [windowManager])

  const handleWindowSetContent = useCallback((windowId: string, contentType: 'markdown' | 'html' | 'component' | 'text', content: string) => {
    console.log('[App] Control: windowSetContent', windowId, contentType)
    windowManager.setWindowContent(windowId, contentType, content)
  }, [windowManager])

  // WebSocket 连接
  useControlSocket({
    url: 'ws://localhost:3001',
    onStateChange: handleControlStateChange,
    onParamsChange: handleControlParamsChange,
    onShow: handleShow,
    onShowEnd: handleShowEnd,
    onWindowOpen: handleWindowOpen,
    onWindowClose: handleWindowClose,
    onWindowMinimize: handleWindowMinimize,
    onWindowMaximize: handleWindowMaximize,
    onWindowMove: handleWindowMove,
    onWindowResize: handleWindowResize,
    onWindowSetContent: handleWindowSetContent,
  })

  // Determine Zed state (with debug override)
  const getAutoState = (): ZedState => {
    // 如果有调试状态，优先使用
    if (debugState) return debugState
    // 根据交互状态自动切换
    if (isRecording) return 'listening'
    if (isLoading) return 'thinking'
    if (isSpeaking) return 'speaking'
    return 'idle'
  }

  const zedState = getAutoState()

  // 根据模式选择参数：始终使用 fluidParams（用户调整后的参数）
  const activeParams = fluidParams

  // Handle mic button click
  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording()
      setListening(false)

      // Transcribe after recording stops
      setTimeout(async () => {
        const blob = audioBlobRef.current
        if (blob) {
          const text = await transcribe(blob)
          if (text) {
            await sendUserMessage(text)
          }
        }
        // 转录完成后释放麦克风流
        releaseStream()
      }, 500)
    } else {
      startRecording()
      setListening(true)
    }
  }

  // Handle text submit
  const handleTextSubmit = async (text: string) => {
    await sendUserMessage(text)
  }

  // Speak when assistant message arrives (防止重复触发)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && !isLoading && lastMessage.id !== spokenMessageIdRef.current) {
        spokenMessageIdRef.current = lastMessage.id
        speak(lastMessage.content)
      }
      prevMessageCountRef.current = messages.length
    }
  }, [messages, isLoading, speak])

  // 状态预设模式切换处理
  const handlePresetToggle = useCallback(() => {
    setUsePreset(prev => !prev)
  }, [])

  // 调试状态切换
  const handleStateChange = useCallback((state: ZedState) => {
    console.log('[App] handleStateChange called with state:', state)
    setDebugState(state)
    setFluidParams(getPreset(state))
  }, [])

  // 当用户开始新的交互时，清除调试状态（让 auto-state 接管）
  useEffect(() => {
    if (isRecording || isLoading || isSpeaking) {
      setDebugState(null)
    }
  }, [isRecording, isLoading, isSpeaking])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Three.js Avatar */}
      <ZedAvatar
        audioIntensity={isRecording || isSpeaking ? 0.5 : 0}
        params={activeParams}
        smooth={usePreset}
        stateId={zedState}
        showContent={showContent}
        frequencyData={isRecording ? frequencyData : null}
      />

      {/* Control Panel for fluid params */}
      <ControlPanel
        params={fluidParams}
        onChange={setFluidParams}
        usePreset={usePreset}
        onPresetToggle={handlePresetToggle}
        currentState={zedState}
        onStateChange={handleStateChange}
        onShow={handleShow}
        onShowEnd={handleShowEnd}
        onCancelShow={handleCancelShow}
      />

      {/* Header */}
      <Header zedState={zedState} />

      {/* Subtitle */}
      <SubtitleDisplay currentMessage={currentMessage} isStreaming={isLoading} />

      {/* Control Bar */}
      <ControlBar
        isRecording={isRecording}
        onMicClick={handleMicClick}
        onTextClick={() => setShowTextInput(!showTextInput)}
        onHistoryClick={() => setShowHistory(true)}
      />

      {/* Text Input */}
      <TextInput
        isOpen={showTextInput}
        onSubmit={handleTextSubmit}
        onClose={() => setShowTextInput(false)}
        isLoading={isLoading}
      />

      {/* History Panel */}
      <HistoryPanel
        isOpen={showHistory}
        messages={messages}
        onClose={() => setShowHistory(false)}
      />

      {/* Hidden audio element for TTS */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Debug Log Display */}
      <LogDisplay />

      {/* Window Manager - 渲染所有 AI 控制的浮动窗口 */}
      <WindowManager
        windows={windowManager.windows}
        onClose={windowManager.closeWindow}
        onMinimize={windowManager.minimizeWindow}
        onMaximize={windowManager.maximizeWindow}
        onFocus={windowManager.focusWindow}
        onMove={windowManager.moveWindow}
        onResize={windowManager.resizeWindow}
      />

      {/* 打开 Demo 窗口的按钮 */}
      <button
        onClick={() => {
          windowManager.openWindow('demo', { title: 'Demo Window', col: 2, row: 2, width: 5, height: 4 })
          windowManager.setWindowContent('demo', 'markdown', `# 浮动窗口 Demo

这是一个由 **AI 控制** 的浮动窗口。

## 功能

- 🖱️ 拖拽标题栏移动窗口
- 📐 拖拽右下角调整大小
- ❌ 点击 × 关闭
- 📏 点击 − 最小化

## 网格吸附

窗口会自动对齐到网格系统（默认 12×8）。

\`\`\`javascript
// 通过 API 控制窗口
curl -X POST http://localhost:3001/api/control \\
  -d '{"action":"windowOpen","windowId":"demo","title":"Hello"}'
\`\`\`
`)
        }}
        aria-label="打开 Demo 窗口"
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          color: '#4ecdc4',
          cursor: 'pointer',
          zIndex: 40,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(78, 205, 196, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="2" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* 新增窗口按钮（调试用） */}
      <button
        onClick={() => {
          const id = `window-${Date.now().toString(36)}`
          const col = Math.floor(Math.random() * 6) + 1
          const row = Math.floor(Math.random() * 4) + 1
          windowManager.openWindow(id, {
            title: `Window ${id.slice(-4)}`,
            col,
            row,
            width: 4,
            height: 3,
          })
          windowManager.setWindowContent(id, 'markdown', `# ${id}\n\n新建窗口，位置: (${col}, ${row})`)
        }}
        aria-label="新增窗口"
        style={{
          position: 'fixed',
          top: '130px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: '#ff6b6b',
          cursor: 'pointer',
          zIndex: 40,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <line x1="9" y1="3" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export default App
