// src/voice/useAudioAnalyser.ts

import { useEffect, useState } from 'react'
import { audioManager } from './audioManager'

/**
 * 从 MediaStream 提取实时频域数据
 * 使用共享 AudioManager 避免创建多个 AudioContext
 */
export function useAudioAnalyser(mediaStream: MediaStream | null): Uint8Array | null {
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)

  useEffect(() => {
    if (!mediaStream) {
      setFrequencyData(null)
      return
    }

    audioManager.retain()
    const { analyser, dataArray } = audioManager.getAnalyser(mediaStream)
    setFrequencyData(dataArray)

    // 每帧更新频域数据
    let rafId: number
    const update = () => {
      analyser.getByteFrequencyData(dataArray)
      rafId = requestAnimationFrame(update)
    }
    update()

    return () => {
      cancelAnimationFrame(rafId)
      audioManager.releaseStream(mediaStream)
      audioManager.release()
      setFrequencyData(null)
    }
  }, [mediaStream])

  return frequencyData
}
