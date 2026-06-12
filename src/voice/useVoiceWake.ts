// src/voice/useVoiceWake.ts

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseVoiceWakeOptions {
  wakeWord?: string
  onWake?: () => void
  enabled?: boolean
}

// SpeechRecognition types
interface SpeechRecognitionEvent {
  results: { length: number; [index: number]: { [index: number]: { transcript: string } } }
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export function useVoiceWake({
  wakeWord = 'zed',
  onWake,
  enabled = false,
}: UseVoiceWakeOptions) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const shouldListenRef = useRef(false)
  const onWakeRef = useRef(onWake)

  // 保持 onWake ref 最新（避免依赖变化导致重连）
  useEffect(() => { onWakeRef.current = onWake }, [onWake])

  const createRecognition = useCallback((): SpeechRecognitionInstance | null => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!Ctor) {
      console.warn('SpeechRecognition not supported')
      return null
    }

    const recognition: SpeechRecognitionInstance = new Ctor()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'zh-CN'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1
      const transcript = event.results[last][0].transcript.toLowerCase()
      if (transcript.includes(wakeWord)) {
        onWakeRef.current?.()
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      console.error('Voice wake error:', event.error)
    }

    // Chrome 约 60s 自动停止，自动重启
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start()
        } catch (e) {
          console.warn('Voice wake restart failed:', e)
          setIsListening(false)
        }
      }
    }

    return recognition
  }, [wakeWord])

  const startListening = useCallback(() => {
    if (!enabled) return

    const recognition = createRecognition()
    if (!recognition) return

    shouldListenRef.current = true
    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsListening(true)
    } catch (e) {
      console.warn('Voice wake start failed:', e)
    }
  }, [enabled, createRecognition])

  const stopListening = useCallback(() => {
    shouldListenRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch (_) { /* ignore */ }
      recognitionRef.current = null
      setIsListening(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      startListening()
    } else {
      stopListening()
    }
    return () => { stopListening() }
  }, [enabled, startListening, stopListening])

  return { isListening, startListening, stopListening }
}
