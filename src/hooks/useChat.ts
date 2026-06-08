// src/hooks/useChat.ts

import { useState, useCallback } from 'react'
import type { Message, ChatState } from '../types'
import { sendMessage } from '../api/openclaw'

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isListening: false,
    isSpeaking: false,
  })

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }))

    return message
  }, [])

  const sendUserMessage = useCallback(async (content: string) => {
    addMessage('user', content)
    setState(prev => ({ ...prev, isLoading: true }))

    const response = await sendMessage(content)

    if (response.success && response.data) {
      addMessage('assistant', response.data.content)
    } else {
      addMessage('assistant', `抱歉，出现了错误：${response.error || '未知错误'}`)
    }

    setState(prev => ({ ...prev, isLoading: false }))
  }, [addMessage])

  const setListening = useCallback((isListening: boolean) => {
    setState(prev => ({ ...prev, isListening }))
  }, [])

  const setSpeaking = useCallback((isSpeaking: boolean) => {
    setState(prev => ({ ...prev, isSpeaking }))
  }, [])

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isListening: state.isListening,
    isSpeaking: state.isSpeaking,
    sendUserMessage,
    setListening,
    setSpeaking,
  }
}
