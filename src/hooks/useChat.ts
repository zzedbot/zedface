// src/hooks/useChat.ts

import { useState, useCallback, useRef } from 'react'
import type { Message, ChatState } from '../types'
import { sendMessage } from '../api/openclaw'

// 自增 ID 计数器，避免 Date.now() 碰撞
let messageCounter = 0

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isListening: false,
    isSpeaking: false,
  })

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: `${Date.now()}-${++messageCounter}`,
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
    if (!content?.trim()) {
      console.warn('[useChat] Empty message, skipping')
      return
    }

    addMessage('user', content)
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await sendMessage(content)

      if (response.success && response.data) {
        addMessage('assistant', response.data.content)
      } else {
        addMessage('assistant', `抱歉，出现了错误：${response.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('[useChat] sendUserMessage error:', error)
      addMessage('assistant', '抱歉，请求失败，请稍后重试')
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
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
