// src/utils/Logger.ts

// 简单的日志管理器，将日志显示在页面上
class LogManager {
  private logs: string[] = [];
  private maxLogs = 500;
  private listeners: (() => void)[] = [];

  log(message: string) {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);

    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 通知监听器
    this.listeners.forEach(listener => listener());
  }

  getLogs(): string {
    return this.logs.join('\n');
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

export const logger = new LogManager();
