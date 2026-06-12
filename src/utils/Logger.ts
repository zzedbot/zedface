// src/utils/Logger.ts

// 日志管理器，将日志显示在页面上
class LogManager {
  private logs: string[] = []
  private maxLogs = 500
  private listeners: (() => void)[] = []
  private cachedText = ''

  log(message: string) {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    const logEntry = `[${timestamp}] ${message}`
    this.logs.push(logEntry)

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    this.cachedText = this.logs.join('\n')
    this.notifyListeners()
  }

  getLogs(): string {
    return this.cachedText
  }

  clear() {
    this.logs = []
    this.cachedText = ''
    this.notifyListeners()
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (err) {
        console.error('[Logger] Listener error:', err)
      }
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
}

export const logger = new LogManager()
