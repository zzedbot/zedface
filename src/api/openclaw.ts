// src/api/openclaw.ts

import type { OpenClawResponse } from '../types'

const OPENCLAW_BASE_URL = import.meta.env.VITE_OPENCLAW_URL || 'https://zedbot.kingdee.space'
const AGENT_SESSION = import.meta.env.VITE_AGENT_SESSION || 'agent:main:dashboard:04f68817-c66c-4baf-a85d-474521783a71'
const REQUEST_TIMEOUT_MS = 30000

export async function sendMessage(message: string): Promise<OpenClawResponse> {
  if (!message?.trim()) {
    return { success: false, error: 'Empty message' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${OPENCLAW_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: AGENT_SESSION, message }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const statusMsg = response.status === 429 ? '请求频率过高，请稍后重试'
        : response.status === 401 ? '未授权，请检查认证'
        : `HTTP ${response.status}`
      throw new Error(statusMsg)
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        content: data.content || data.message || '',
        sessionId: AGENT_SESSION,
      },
    }
  } catch (error) {
    clearTimeout(timeoutId)
    const errorMsg = (error as Error).name === 'AbortError'
      ? '请求超时，请检查网络连接'
      : (error instanceof Error ? error.message : 'Unknown error')
    console.error('OpenClaw API error:', errorMsg)
    return { success: false, error: errorMsg }
  }
}
