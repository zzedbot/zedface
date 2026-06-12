// src/voice/audioManager.ts

/**
 * 全局共享 AudioContext 管理器
 * 避免多个组件各自创建 AudioContext（浏览器有数量限制）
 */

class AudioManager {
  private context: AudioContext | null = null
  private refCount = 0
  private analyserCache = new Map<MediaStream, { analyser: AnalyserNode; source: MediaStreamAudioSourceNode }>()

  /**
   * 获取或创建 AudioContext
   */
  getContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext()
    }
    // 处理 suspended 状态
    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => {})
    }
    return this.context
  }

  /**
   * 为 MediaStream 创建或复用 AnalyserNode
   */
  getAnalyser(stream: MediaStream): { analyser: AnalyserNode; dataArray: Uint8Array } {
    const cached = this.analyserCache.get(stream)
    if (cached) {
      const dataArray = new Uint8Array(cached.analyser.frequencyBinCount)
      return { analyser: cached.analyser, dataArray }
    }

    const ctx = this.getContext()
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    source.connect(analyser)

    this.analyserCache.set(stream, { analyser, source })
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    return { analyser, dataArray }
  }

  /**
   * 释放特定 stream 的资源
   */
  releaseStream(stream: MediaStream): void {
    const cached = this.analyserCache.get(stream)
    if (cached) {
      cached.source.disconnect()
      cached.analyser.disconnect()
      this.analyserCache.delete(stream)
    }
  }

  /**
   * 引用计数增加（表示有组件正在使用）
   */
  retain(): void {
    this.refCount++
  }

  /**
   * 引用计数减少，到 0 时关闭 AudioContext
   */
  release(): void {
    this.refCount = Math.max(0, this.refCount - 1)
    if (this.refCount === 0 && this.context) {
      // 清理所有 analyser
      for (const [, { source, analyser }] of this.analyserCache) {
        source.disconnect()
        analyser.disconnect()
      }
      this.analyserCache.clear()

      this.context.close().catch(() => {})
      this.context = null
    }
  }
}

// 全局单例
export const audioManager = new AudioManager()
