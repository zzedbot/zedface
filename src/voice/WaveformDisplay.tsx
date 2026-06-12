// src/voice/WaveformDisplay.tsx

import { useEffect, useRef } from 'react'
import { audioManager } from './audioManager'

interface WaveformDisplayProps {
  isActive: boolean
  audioStream?: MediaStream | null
  color?: string
}

export function WaveformDisplay({
  isActive,
  audioStream = null,
  color = '#4ecdc4',
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isActive) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    let analyser: AnalyserNode | null = null
    let dataArray: Uint8Array | null = null

    if (audioStream) {
      audioManager.retain()
      const result = audioManager.getAnalyser(audioStream)
      analyser = result.analyser
      dataArray = result.dataArray
    }

    // 预创建 gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, '#ff6b6b')

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray)

        const barWidth = (width / dataArray.length) * 2.5
        let x = 0
        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * height
          ctx.fillStyle = gradient
          ctx.fillRect(x, height - barHeight, barWidth, barHeight)
          x += barWidth + 1
        }
      } else {
        const time = performance.now() / 200
        const barCount = 20
        const bw = width / barCount
        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.abs(Math.sin(time + i * 0.3)) * height * 0.8
          ctx.fillStyle = gradient
          ctx.fillRect(i * bw, height - barHeight, bw - 2, barHeight)
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioStream) {
        audioManager.releaseStream(audioStream)
        audioManager.release()
      }
    }
  }, [isActive, audioStream, color])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={80}
      style={{
        position: 'absolute',
        top: '45%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: '600px',
        height: '80px',
        zIndex: 4,
      }}
    />
  )
}
