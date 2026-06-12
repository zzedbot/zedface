// src/voice/useKokoro.ts

import { useState, useCallback, useRef } from 'react'

const KOKORO_API_URL = import.meta.env.VITE_KOKORO_API_URL || 'http://localhost:8000/tts'
const TTS_TIMEOUT_MS = 30000

export function useKokoro() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentUrlRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text?.trim()) {
      console.warn('[useKokoro] Empty text, skipping')
      return
    }

    // 取消上一次请求
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // 停止并 revoke 旧 URL
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }

    setIsGenerating(true)

    try {
      const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS)

      const response = await fetch(KOKORO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker: 'default', speed: 1.0 }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`TTS generation failed: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      currentUrlRef.current = audioUrl

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        try {
          await audioRef.current.play()
        } catch (playError) {
          // 播放失败（如自动播放策略阻止），清理 URL
          URL.revokeObjectURL(audioUrl)
          currentUrlRef.current = null
          setIsSpeaking(false)
          throw playError
        }
        setIsSpeaking(true)

        audioRef.current.onended = () => {
          setIsSpeaking(false)
          if (currentUrlRef.current === audioUrl) {
            URL.revokeObjectURL(audioUrl)
            currentUrlRef.current = null
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('[useKokoro] Request aborted')
      } else {
        console.error('Kokoro error:', error)
      }
      setIsSpeaking(false)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    // revoke 当前 URL
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }
    abortRef.current?.abort()
    setIsSpeaking(false)
  }, [])

  return {
    isSpeaking,
    isGenerating,
    speak,
    stop,
    audioRef,
  }
}
