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
