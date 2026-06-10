// src/show/ShowManager.ts

import { canvasSampler } from '../utils/CanvasSampler'
import type { FluidParticles } from '../zed/FluidParticles'

export type ShowContentType = 'text' | 'emoji' | 'image' | 'shape'

export interface ShowOptions {
  fontSize?: number
  fontFamily?: string
  color?: string
  width?: number
  height?: number
  size?: number
}

export class ShowManager {
  private particles: FluidParticles | null = null

  constructor(particles: FluidParticles) {
    this.particles = particles
  }

  /**
   * 展示文字
   */
  async showText(text: string, options: ShowOptions = {}): Promise<void> {
    if (!this.particles) return

    console.log('[ShowManager] Showing text:', text)
    const positions = canvasSampler.sampleText(text, {
      fontSize: options.fontSize || 100,
      fontFamily: options.fontFamily || 'Arial, sans-serif',
      color: options.color || '#ffffff',
      maxPoints: 6000,
    })

    this.particles.setShowContent(positions)
  }

  /**
   * 展示 Emoji
   */
  async showEmoji(emoji: string, options: ShowOptions = {}): Promise<void> {
    if (!this.particles) return

    console.log('[ShowManager] Showing emoji:', emoji)
    const positions = canvasSampler.sampleEmoji(emoji, {
      fontSize: options.fontSize || 200,
      maxPoints: 6000,
    })

    this.particles.setShowContent(positions)
  }

  /**
   * 展示图片（支持 URL 和 Base64）
   */
  async showImage(source: string, options: ShowOptions = {}): Promise<void> {
    if (!this.particles) return

    console.log('[ShowManager] Showing image:', source.substring(0, 50) + '...')

    try {
      const positions = await canvasSampler.sampleImage(source, {
        width: options.width || 300,
        height: options.height || 300,
        maxPoints: 6000,
      })

      this.particles.setShowContent(positions)
    } catch (error) {
      console.error('[ShowManager] Failed to show image:', error)
    }
  }

  /**
   * 展示预定义图形
   */
  async showShape(shape: string, options: ShowOptions = {}): Promise<void> {
    if (!this.particles) return

    console.log('[ShowManager] Showing shape:', shape)
    const positions = canvasSampler.sampleShape(shape, {
      size: options.size || 200,
      maxPoints: 6000,
    })

    this.particles.setShowContent(positions)
  }

  /**
   * 退出展示模式
   */
  exitShow(): void {
    if (!this.particles) return

    console.log('[ShowManager] Exiting show mode')
    this.particles.exitShowMode()
  }

  /**
   * 检查是否在展示模式
   */
  isInShowMode(): boolean {
    return this.particles?.isInShowMode() || false
  }
}
