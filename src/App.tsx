// src/App.tsx

import { useState, useEffect, useRef } from 'react'
import { Header } from './components/Header'
import { SubtitleDisplay } from './components/SubtitleDisplay'
import { ControlBar } from './components/ControlBar'
import { HistoryPanel } from './components/HistoryPanel'
import { TextInput } from './components/TextInput'
import { WaveformDisplay } from './voice/WaveformDisplay'
import { ZedAvatar } from './zed/ZedAvatar'
import { useChat } from './hooks/useChat'
import { useVoiceRecorder } from './voice/useVoiceRecorder'
import { useWhisper } from './voice/useWhisper'
import { useKokoro } from './voice/useKokoro'
import type { ZedState } from './types'

function App() {
  const { messages, isLoading, sendUserMessage, setListening } = useChat()
  const { isRecording, audioBlob, startRecording, stopRecording } = useVoiceRecorder()
  const { transcribe } = useWhisper()
  const { isSpeaking, speak, audioRef } = useKokoro()

  const [showHistory, setShowHistory] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)

  const currentMessage = messages.length > 0 ? messages[messages.length - 1] : null
  const prevMessageCountRef = useRef(messages.length)

  // Determine Zed state
  const getZedState = (): ZedState => {
    if (isRecording) return 'listening'
    if (isLoading) return 'thinking'
    if (isSpeaking) return 'speaking'
    return 'idle'
  }

  const zedState = getZedState()

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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Three.js Avatar */}
      <ZedAvatar audioIntensity={isRecording || isSpeaking ? 0.5 : 0} />

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
