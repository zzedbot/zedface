// src/voice/useVoiceWake.ts

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseVoiceWakeOptions {
  wakeWord?: string
  onWake?: () => void
  enabled?: boolean
}

// SpeechRecognition types (not in default TypeScript lib)
interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  start: () => void
  stop: () => void
}

export function useVoiceWake({
  wakeWord = 'zed',
  onWake,
  enabled = false,
}: UseVoiceWakeOptions) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const startListening = useCallback(() => {
    if (!enabled || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      return
    }

    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition: SpeechRecognitionInstance = new SpeechRecognitionCtor()

    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'zh-CN'

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1
      const transcript = event.results[last][0].transcript.toLowerCase()

      if (transcript.includes(wakeWord)) {
        onWake?.()
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Voice wake error:', event.error)
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }, [enabled, wakeWord, onWake])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      startListening()
    } else {
      stopListening()
    }

    return () => {
      stopListening()
    }
  }, [enabled, startListening, stopListening])

  return {
    isListening,
    startListening,
    stopListening,
  }
}
