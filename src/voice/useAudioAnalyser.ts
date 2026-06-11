// src/voice/useAudioAnalyser.ts

import { useEffect, useRef, useState } from 'react'

/**
 * 从 MediaStream 提取实时频域数据
 * 返回一个持久的 Uint8Array 引用，数据在每次 requestAnimationFrame 时更新
 */
export function useAudioAnalyser(mediaStream: MediaStream | null): Uint8Array | null {
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    if (!mediaStream) {
      // 清理
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = undefined
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      analyserRef.current = null
      dataArrayRef.current = null
      setFrequencyData(null)
      return
    }

    // 创建 AudioContext 和 AnalyserNode
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256 // → 128 frequency bins
    analyser.smoothingTimeConstant = 0.8

    const source = audioContext.createMediaStreamSource(mediaStream)
    source.connect(analyser)
    // 不连接到 destination，避免回声

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    dataArrayRef.current = dataArray

    audioContextRef.current = audioContext
    analyserRef.current = analyser
    setFrequencyData(dataArray)

    // 每帧更新频域数据
    const update = () => {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)
      }
      rafRef.current = requestAnimationFrame(update)
    }
    update()

    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = undefined
      }
      audioContext.close()
      audioContextRef.current = null
      analyserRef.current = null
      dataArrayRef.current = null
      setFrequencyData(null)
    }
  }, [mediaStream])

  return frequencyData
}
