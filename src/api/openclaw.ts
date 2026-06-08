// src/api/openclaw.ts

import type { OpenClawResponse } from '../types'

const OPENCLAW_BASE_URL = 'https://zedbot.kingdee.space'
const AGENT_SESSION = 'agent:main:dashboard:04f68817-c66c-4baf-a85d-474521783a71'

export async function sendMessage(message: string): Promise<OpenClawResponse> {
  try {
    const response = await fetch(`${OPENCLAW_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: AGENT_SESSION,
        message,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
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
    console.error('OpenClaw API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
