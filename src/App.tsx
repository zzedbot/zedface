// src/App.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { Header } from './components/Header'
import { SubtitleDisplay } from './components/SubtitleDisplay'
import { ControlBar } from './components/ControlBar'
import { ControlPanel } from './components/ControlPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { TextInput } from './components/TextInput'
import { WaveformDisplay } from './voice/WaveformDisplay'
import { ZedAvatar } from './zed/ZedAvatar'
import { statePresets } from './zed/statePresets'
import { useChat } from './hooks/useChat'
import { useVoiceRecorder } from './voice/useVoiceRecorder'
import { useWhisper } from './voice/useWhisper'
import { useKokoro } from './voice/useKokoro'
import { useControlSocket } from './hooks/useControlSocket'
import type { ZedState } from './types'
import type { FluidParams } from './components/ControlPanel'

function App() {
  const { messages, isLoading, sendUserMessage, setListening } = useChat()
  const { isRecording, audioBlob, startRecording, stopRecording } = useVoiceRecorder()
  const { transcribe } = useWhisper()
  const { isSpeaking, speak, audioRef } = useKokoro()

  const [showHistory, setShowHistory] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [fluidParams, setFluidParams] = useState<FluidParams>(statePresets.intro)
  const [usePreset, setUsePreset] = useState(true) // 默认使用状态预设模式
  const [debugState, setDebugState] = useState<ZedState>('intro') // 初始状态为 intro
  const [showContent, setShowContent] = useState<{
    type: 'text' | 'emoji' | 'image' | 'shape'
    content: string
    options?: any
  } | null>(null)

  const currentMessage = messages.length > 0 ? messages[messages.length - 1] : null
  const prevMessageCountRef = useRef(messages.length)

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
    setShowContent(null)
    setDebugState('idle')
    setFluidParams(statePresets.idle)
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
        if (audioBlob) {
          const text = await transcribe(audioBlob)
          if (text) {
            await sendUserMessage(text)
          }
        }
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

  // Speak when assistant message arrives
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && !isLoading) {
        speak(lastMessage.content)
      }
      prevMessageCountRef.current = messages.length
    }
  }, [messages, isLoading, speak])

  // 状态预设模式切换处理
  const handlePresetToggle = () => {
    setUsePreset(!usePreset)
  }

  // 调试状态切换
  const handleStateChange = (state: ZedState) => {
    console.log('[App] handleStateChange called with state:', state)
    setDebugState(state)
    setFluidParams(statePresets[state])
    console.log('[App] setFluidParams called with:', statePresets[state])
  }

  // 当用户开始新的交互时，清除调试状态
  useEffect(() => {
    if (isRecording || isLoading || isSpeaking) {
      setDebugState('idle')
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
      />

      {/* Control Panel for fluid params */}
      <ControlPanel
        params={fluidParams}
        onChange={setFluidParams}
        usePreset={usePreset}
        onPresetToggle={handlePresetToggle}
        currentState={zedState}
        onStateChange={handleStateChange}
      />

      {/* Header */}
      <Header zedState={zedState} />

      {/* Waveform */}
      <WaveformDisplay isActive={isRecording || isSpeaking} />

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
      <audio ref={(el) => {
        if (el) {
          (audioRef as React.MutableRefObject<HTMLAudioElement | null>).current = el
        }
      }} style={{ display: 'none' }} />
    </div>
  )
}

export default App
