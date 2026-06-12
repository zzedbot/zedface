// src/voice/useWhisper.ts

import { useState, useCallback, useRef } from 'react'

const WHISPER_API_URL = import.meta.env.VITE_WHISPER_URL || 'http://localhost:9000/transcribe'
const TRANSCRIBE_TIMEOUT_MS = 30000

export function useWhisper() {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribedText, setTranscribedText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const transcribe = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    // 取消上一次请求
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsTranscribing(true)
    setError(null)
    setTranscribedText(null)

    const timeoutId = setTimeout(() => controller.abort(), TRANSCRIBE_TIMEOUT_MS)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`)
      }

      const data = await response.json()
      const text = data.text || data.transcript || ''
      setTranscribedText(text)
      return text
    } catch (err) {
      clearTimeout(timeoutId)
      const errorMessage = (err as Error).name === 'AbortError'
        ? 'Transcription timeout'
        : err instanceof Error ? err.message : 'Transcription failed'
      setError(errorMessage)
      console.error('Whisper error:', errorMessage)
      return null
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  return {
    isTranscribing,
    transcribedText,
    error,
    transcribe,
  }
}
