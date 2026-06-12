// src/types/index.ts

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  isListening: boolean
  isSpeaking: boolean
}

export interface OpenClawResponse {
  success: boolean
  data?: {
    content: string
    sessionId: string
  }
  error?: string
}

export type ZedState =
  | 'intro'
  | 'idle'
  | 'offline'
  | 'reconnecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error'
  | 'show'

export interface FluidParams {
  // Particle settings
  particleCount: number
  particleSize: number
  particleSides: number // 0=circle, 3=triangle, 4=square, 5=pentagon...
  radius: number

  // Animation
  animSpeed: number
  breathSpeed: number
  breathAmplitude: number
  noiseAmplitude: number
  rotationSpeed: number

  // Transition
  transitionSpeed: number // 状态切换过渡速度 (0.01-0.3)

  // Visual
  colorMixSpeed: number
  glowIntensity: number
  alphaBase: number
  primaryColor: string
  secondaryColor: string
}
