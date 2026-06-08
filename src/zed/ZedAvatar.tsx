// src/zed/ZedAvatar.tsx

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FluidParticles } from './FluidParticles'
import type { FluidParams } from '../components/ControlPanel'

interface ZedAvatarProps {
  audioIntensity?: number
  params: FluidParams
}

export function ZedAvatar({ audioIntensity = 0, params }: ZedAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const particlesRef = useRef<FluidParticles | null>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const audioIntensityRef = useRef(audioIntensity)

  // Keep refs in sync with props
  useEffect(() => {
    audioIntensityRef.current = audioIntensity
  }, [audioIntensity])

  // Update params when they change
  useEffect(() => {
    if (particlesRef.current) {
      particlesRef.current.updateParams(params)
    }
  }, [params])

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
    camera.position.y = 0.5
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

    // Animation loop
    const clock = new THREE.Clock()
    const animate = () => {
      const elapsedTime = clock.getElapsedTime()
      particles.update(elapsedTime, audioIntensityRef.current)
      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

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
