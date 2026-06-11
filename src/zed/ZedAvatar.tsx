// src/zed/ZedAvatar.tsx

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FluidParticles } from './FluidParticles'
import { ShowManager } from '../show/ShowManager'
import { logger } from '../utils/Logger'
import type { FluidParams } from '../components/ControlPanel'

interface ShowContent {
  type: 'text' | 'emoji' | 'image' | 'shape'
  content: string
  options?: any
}

interface ZedAvatarProps {
  audioIntensity?: number
  params: FluidParams
  smooth?: boolean // 是否使用平滑过渡（状态预设模式）
  showContent?: ShowContent | null // 展示内容
  frequencyData?: Uint8Array | null // 实时频域数据（监听模式用）
  onShowManagerReady?: (manager: ShowManager) => void // ShowManager 就绪回调
}

export function ZedAvatar({ audioIntensity = 0, params, smooth = false, showContent, frequencyData, onShowManagerReady }: ZedAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const particlesRef = useRef<FluidParticles | null>(null)
  const showManagerRef = useRef<ShowManager | null>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const audioIntensityRef = useRef(audioIntensity)
  const frequencyDataRef = useRef<Uint8Array | null>(null)

  // 鼠标拖动旋转
  const isDraggingRef = useRef(false)
  const lastMouseXRef = useRef(0)
  const dragRotationRef = useRef(0)  // 累计拖动旋转量
  const dragVelocityRef = useRef(0)  // 拖动速度（用于惯性）

  // Keep refs in sync with props
  useEffect(() => {
    audioIntensityRef.current = audioIntensity
  }, [audioIntensity])

  useEffect(() => {
    frequencyDataRef.current = frequencyData ?? null
  }, [frequencyData])

  // Update params when they change (keep current radius and particleSize from control panel)
  useEffect(() => {
    console.log('[ZedAvatar] params changed, smooth:', smooth, 'animSpeed:', params.animSpeed)
    if (particlesRef.current) {
      if (smooth) {
        console.log('[ZedAvatar] calling setTargetParams')
        particlesRef.current.setTargetParams(params)
      } else {
        console.log('[ZedAvatar] calling updateParams')
        particlesRef.current.updateParams(params)
      }
    } else {
      console.log('[ZedAvatar] particlesRef.current is null')
    }
  }, [params, smooth])

  // Handle show content changes
  useEffect(() => {
    if (!showManagerRef.current) return

    if (showContent) {
      logger.log(`[ZedAvatar] Show content: ${showContent.type} - ${showContent.content}`)
      switch (showContent.type) {
        case 'text':
          showManagerRef.current.showText(showContent.content, showContent.options)
          break
        case 'emoji':
          showManagerRef.current.showEmoji(showContent.content, showContent.options)
          break
        case 'image':
          showManagerRef.current.showImage(showContent.content, showContent.options)
          break
        case 'shape':
          showManagerRef.current.showShape(showContent.content, showContent.options)
          break
      }
    } else {
      // 如果没有 showContent
      if (showManagerRef.current.isInShowMode()) {
        // 如果已经在展示模式，退出展示模式
        logger.log('[ZedAvatar] Exit show mode')
        showManagerRef.current.exitShow()
      } else {
        // 如果不在展示模式（可能在"等待参数过渡"状态），取消展示
        logger.log('[ZedAvatar] Cancel show mode')
        showManagerRef.current.cancelShow()
      }
    }
  }, [showContent])

  useEffect(() => {
    if (!containerRef.current) return

    // Setup
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100)
    camera.position.z = 6
    camera.position.y = -0.5
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Particles
    const particles = new FluidParticles(scene, params)
    particlesRef.current = particles

    // ShowManager
    const showManager = new ShowManager(particles)
    showManagerRef.current = showManager

    // 通知 ShowManager 已就绪
    if (onShowManagerReady) {
      onShowManagerReady(showManager)
    }

    // Animation loop
    const clock = new THREE.Clock()
    const animate = () => {
      const elapsedTime = clock.getElapsedTime()
      particles.updateFrequencyData(frequencyDataRef.current)
      particles.setUserRotation(dragRotationRef.current)
      particles.update(elapsedTime, audioIntensityRef.current)

      // 应用拖动旋转（带惯性衰减）
      if (!isDraggingRef.current && Math.abs(dragVelocityRef.current) > 0.0001) {
        dragRotationRef.current += dragVelocityRef.current
        dragVelocityRef.current *= 0.95  // 惯性衰减
      }

      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    // 鼠标拖动旋转处理
    const canvas = renderer.domElement
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      lastMouseXRef.current = e.clientX
      dragVelocityRef.current = 0
      canvas.style.cursor = 'grabbing'
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const deltaX = e.clientX - lastMouseXRef.current
      lastMouseXRef.current = e.clientX

      const rotationDelta = deltaX * 0.005
      dragRotationRef.current += rotationDelta
      dragVelocityRef.current = rotationDelta
    }
    const handleMouseUp = () => {
      isDraggingRef.current = false
      canvas.style.cursor = 'grab'
    }

    canvas.style.cursor = 'grab'
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (particlesRef.current) {
        particlesRef.current.dispose()
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  )
}
