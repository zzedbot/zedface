// src/voice/useWhisper.ts

import { useState, useCallback } from 'react'

const WHISPER_API_URL = 'http://localhost:9000/transcribe' // Adjust based on your Whisper deployment

export function useWhisper() {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribedText, setTranscribedText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const transcribe = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    setIsTranscribing(true)
    setError(null)
    setTranscribedText(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`)
      }

      const data = await response.json()
      const text = data.text || data.transcript || ''
      setTranscribedText(text)
      return text
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transcription failed'
      setError(errorMessage)
      console.error('Whisper error:', err)
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
