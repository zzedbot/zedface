// src/App.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { Header } from './components/Header'
import { SubtitleDisplay } from './components/SubtitleDisplay'
import { ControlBar } from './components/ControlBar'
import { ControlPanel } from './components/ControlPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { TextInput } from './components/TextInput'
import { ZedAvatar } from './zed/ZedAvatar'
import { statePresets } from './zed/statePresets'
import { useChat } from './hooks/useChat'
import { useVoiceRecorder } from './voice/useVoiceRecorder'
import { useAudioAnalyser } from './voice/useAudioAnalyser'
import { useWhisper } from './voice/useWhisper'
import { useKokoro } from './voice/useKokoro'
import { useControlSocket } from './hooks/useControlSocket'
import { LogDisplay } from './components/LogDisplay'
import type { ZedState, FluidParams } from './types'

function App() {
  const { messages, isLoading, sendUserMessage, setListening } = useChat()
  const { isRecording, audioBlob, mediaStream, startRecording, stopRecording, releaseStream } = useVoiceRecorder()
  const frequencyData = useAudioAnalyser(isRecording ? mediaStream : null)
  const { transcribe } = useWhisper()
  const { isSpeaking, speak, audioRef } = useKokoro()

  const [showHistory, setShowHistory] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [fluidParams, setFluidParams] = useState<FluidParams>(statePresets.intro)
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
    setFluidParams(statePresets[state])
  }, [])

  const handleControlParamsChange = useCallback((params: Partial<FluidParams>) => {
    console.log('[App] Control: setParams', params)
    setFluidParams(prev => ({ ...prev, ...params }))
  }, [])

  const handleShow = useCallback((type: 'text' | 'emoji' | 'image' | 'shape', content: string, options?: any) => {
    console.log('[App] Control: show', type, content)
    setDebugState('show')
    setFluidParams(statePresets.show)
    setShowContent({ type, content, options })
  }, [])

  const handleShowEnd = useCallback(() => {
    console.log('[App] Control: showEnd')
    // 取消上一个 timer（防止竞态）
    if (showEndTimerRef.current !== null) {
      clearTimeout(showEndTimerRef.current)
    }
    setShowContent(null)

    showEndTimerRef.current = window.setTimeout(() => {
      console.log('[App] Control: showEnd - switching to idle')
      setDebugState(null)
      setFluidParams(statePresets.idle)
      showEndTimerRef.current = null
    }, 2000)
  }, [])

  const handleCancelShow = useCallback(() => {
    console.log('[App] Control: cancelShow')
    setShowContent(null)
    // 保持 show 状态的参数，不恢复到 idle
  }, [])

  // WebSocket 连接
  useControlSocket({
    url: 'ws://localhost:3001',
    onStateChange: handleControlStateChange,
    onParamsChange: handleControlParamsChange,
    onShow: handleShow,
    onShowEnd: handleShowEnd,
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
    setFluidParams(statePresets[state])
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
    </div>
  )
}

export default App
