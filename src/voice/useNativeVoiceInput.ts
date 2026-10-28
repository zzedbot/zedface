import { useCallback, useEffect, useState } from 'react'

interface NativeVoiceBridge {
  isAvailable(): boolean
  toggleVoiceInput(): void
  startVoiceInput(): void
  stopVoiceInput(): void
}

interface NativeVoiceDetail {
  type: 'ready' | 'listening' | 'partial' | 'final' | 'error' | 'idle'
  text?: string
}

declare global {
  interface Window {
    ZedFaceAndroid?: NativeVoiceBridge
  }
}

export function useNativeVoiceInput(onFinalText: (text: string) => void | Promise<void>) {
  const [isRecording, setIsRecording] = useState(false)
  const [statusText, setStatusText] = useState('')
  const isNative = Boolean(window.ZedFaceAndroid)

  useEffect(() => {
    const handleVoiceEvent = (event: Event) => {
      const detail = (event as CustomEvent<NativeVoiceDetail>).detail
      switch (detail.type) {
        case 'ready':
          setStatusText('')
          break
        case 'listening':
          setIsRecording(true)
          setStatusText('正在聆听…松开语音键即可发送')
          break
        case 'partial':
          setStatusText(detail.text?.trim() || '正在聆听…')
          break
        case 'final': {
          setIsRecording(false)
          const text = detail.text?.trim() || ''
          setStatusText(text ? `识别结果：${text}` : '没有识别到语音')
          if (text) void onFinalText(text)
          window.setTimeout(() => setStatusText(''), 3500)
          break
        }
        case 'error':
          setIsRecording(false)
          setStatusText(detail.text || '语音识别失败')
          break
        case 'idle':
          setIsRecording(false)
          break
      }
    }

    window.addEventListener('zedface-native-voice', handleVoiceEvent)
    return () => window.removeEventListener('zedface-native-voice', handleVoiceEvent)
  }, [onFinalText])

  const toggle = useCallback(() => window.ZedFaceAndroid?.toggleVoiceInput(), [])

  return { isNative, isRecording, statusText, toggle }
}
