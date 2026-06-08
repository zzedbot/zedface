// src/voice/useKokoro.ts

import { useState, useCallback, useRef } from 'react'

const KOKORO_API_URL = 'http://localhost:8000/tts' // Adjust based on your Kokoro deployment

export function useKokoro() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(async (text: string): Promise<void> => {
    setIsGenerating(true)

    try {
      const response = await fetch(KOKORO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          speaker: 'default',
          speed: 1.0,
        }),
      })

      if (!response.ok) {
        throw new Error(`TTS generation failed: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setIsSpeaking(true)

        audioRef.current.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
        }
      }
    } catch (error) {
      console.error('Kokoro error:', error)
      setIsSpeaking(false)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsSpeaking(false)
    }
  }, [])

  return {
    isSpeaking,
    isGenerating,
    speak,
    stop,
    audioRef,
  }
}
