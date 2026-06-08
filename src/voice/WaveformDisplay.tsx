// src/voice/WaveformDisplay.tsx

import { useEffect, useRef } from 'react'

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
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    let analyser: AnalyserNode | null = null
    let dataArray: Uint8Array<ArrayBuffer> | null = null

    if (audioStream) {
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(audioStream)
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      dataArray = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray)

        const barWidth = (width / dataArray.length) * 2.5
        let x = 0

        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * height

          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
          gradient.addColorStop(0, color)
          gradient.addColorStop(1, '#ff6b6b')

          ctx.fillStyle = gradient
          ctx.fillRect(x, height - barHeight, barWidth, barHeight)

          x += barWidth + 1
        }
      } else if (isActive) {
        // Idle animation when no audio stream
        const time = Date.now() / 200
        const barCount = 20
        const barWidth = width / barCount

        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.abs(Math.sin(time + i * 0.3)) * height * 0.8
          const x = i * barWidth

          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
          gradient.addColorStop(0, color)
          gradient.addColorStop(1, '#ff6b6b')

          ctx.fillStyle = gradient
          ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight)
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    if (isActive) {
      draw()
    } else {
      ctx.clearRect(0, 0, width, height)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, audioStream, color])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      style={{
        position: 'absolute',
        top: '45%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 4,
      }}
    />
  )
}
