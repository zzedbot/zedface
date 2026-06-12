// src/utils/CanvasSampler.ts

export interface SampleOptions {
  width?: number
  height?: number
  fontSize?: number
  fontFamily?: string
  color?: string
  maxPoints?: number
  size?: number
  maxWidth?: number
  maxHeight?: number
}

// 常量
const ALPHA_THRESHOLD = 128
const SAMPLE_STEP = 2
const SHOW_RADIUS = 3.0
const Z_DEPTH_RANGE = 0.2
const IMAGE_LOAD_TIMEOUT_MS = 15000

export class CanvasSampler {
  private static readonly GOLDEN_RATIO = 0.618

  /**
   * 获取屏幕尺寸
   */
  private getScreenSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }

  /**
   * 获取最大展示尺寸（基于黄金比例）
   */
  private getMaxDisplaySize(): { maxWidth: number; maxHeight: number } {
    const screen = this.getScreenSize()
    return {
      maxWidth: screen.width * CanvasSampler.GOLDEN_RATIO,
      maxHeight: screen.height * CanvasSampler.GOLDEN_RATIO,
    }
  }

  /**
   * 采样文字（支持自动换行和缩放）
   */
  sampleText(text: string, options: SampleOptions = {}): Float32Array {
    // 空输入保护
    if (!text || !text.trim()) {
      return new Float32Array(0)
    }

    const {
      fontFamily = 'Arial, sans-serif',
      color = '#ffffff',
      maxPoints = 12000,
    } = options

    const screen = this.getScreenSize()
    const screenAspectRatio = screen.width / screen.height
    const maxDisplayWidth = screen.width * CanvasSampler.GOLDEN_RATIO
    const maxDisplayHeight = screen.height * CanvasSampler.GOLDEN_RATIO

    // 使用临时 canvas 测量文字
    const measureCanvas = document.createElement('canvas')
    const measureCtx = measureCanvas.getContext('2d')!
    const baseFontSize = 100
    measureCtx.font = `bold ${baseFontSize}px ${fontFamily}`

    // 处理换行
    const inputLines = text.split('\n')
    const lines: string[] = []

    for (const inputLine of inputLines) {
      const words = inputLine.split(' ')
      let currentLine = ''
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word
        const testWidth = measureCtx.measureText(testLine).width

        if (testWidth > maxDisplayWidth && currentLine) {
          if (currentLine.trim()) lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      if (currentLine.trim()) lines.push(currentLine)
    }

    if (lines.length === 0) {
      return new Float32Array(0)
    }

    // 计算缩放
    const lineWidths = lines.map(line => measureCtx.measureText(line).width)
    const maxLineWidth = Math.max(...lineWidths, 1) // 保护除零
    const baseLineHeight = baseFontSize * 1.2
    const totalBaseHeight = lines.length * baseLineHeight

    const widthScale = maxDisplayWidth / maxLineWidth
    const heightScale = maxDisplayHeight / totalBaseHeight
    const scale = Math.min(widthScale, heightScale)
    const finalFontSize = Math.max(1, Math.floor(baseFontSize * scale))

    // 创建主 canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const canvasWidth = Math.ceil(maxDisplayWidth)
    const canvasHeight = Math.ceil(maxDisplayHeight)
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // 绘制文字
    ctx.fillStyle = color
    ctx.font = `bold ${finalFontSize}px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const lineHeight = finalFontSize * 1.2
    const totalTextHeight = lines.length * lineHeight
    const startY = canvasHeight / 2 - totalTextHeight / 2 + lineHeight / 2

    lines.forEach((line, index) => {
      ctx.fillText(line, canvasWidth / 2, startY + index * lineHeight)
    })

    return this.samplePixelsFromCanvas(canvas, ctx, maxPoints)
  }

  /**
   * 采样 Emoji
   */
  sampleEmoji(emoji: string, options: SampleOptions = {}): Float32Array {
    if (!emoji) return new Float32Array(0)

    const { fontSize = 200, maxPoints = 12000 } = options
    const maxDisplay = this.getMaxDisplaySize()
    const maxWidth = options.maxWidth || maxDisplay.maxWidth
    const maxHeight = options.maxHeight || maxDisplay.maxHeight

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!

    let adjustedFontSize = fontSize
    ctx.font = `${adjustedFontSize}px serif`
    const emojiWidth = ctx.measureText(emoji).width
    const emojiHeight = adjustedFontSize * 1.2

    if (emojiWidth > maxWidth || emojiHeight > maxHeight) {
      const scale = Math.min(maxWidth / emojiWidth, maxHeight / emojiHeight)
      adjustedFontSize = Math.max(1, Math.floor(adjustedFontSize * scale))
    }

    const canvasSize = Math.ceil(adjustedFontSize * 1.5)
    canvas.width = canvasSize
    canvas.height = canvasSize

    ctx.font = `${adjustedFontSize}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, canvasSize / 2, canvasSize / 2)

    return this.samplePixelsFromCanvas(canvas, ctx, maxPoints)
  }

  /**
   * 采样图片
   */
  async sampleImage(source: string, options: SampleOptions = {}): Promise<Float32Array> {
    const { maxPoints = 12000 } = options
    const maxDisplay = this.getMaxDisplaySize()
    const maxWidth = options.maxWidth || maxDisplay.maxWidth
    const maxHeight = options.maxHeight || maxDisplay.maxHeight

    const canvasWidth = Math.ceil(maxWidth)
    const canvasHeight = Math.ceil(maxHeight)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      const timeoutId = setTimeout(() => {
        img.src = '' // 取消加载
        reject(new Error('Image load timeout'))
      }, IMAGE_LOAD_TIMEOUT_MS)

      img.onload = () => {
        clearTimeout(timeoutId)
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const x = (canvasWidth - scaledWidth) / 2
        const y = (canvasHeight - scaledHeight) / 2

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
        resolve(this.samplePixelsFromCanvas(canvas, ctx, maxPoints))
      }

      img.onerror = () => {
        clearTimeout(timeoutId)
        reject(new Error('Failed to load image'))
      }

      img.src = source
    })
  }

  /**
   * 采样预定义图形
   */
  sampleShape(shape: string, options: SampleOptions = {}): Float32Array {
    const { size = 200, maxPoints = 6000 } = options

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = size
    canvas.height = size
    ctx.fillStyle = '#ffffff'

    const center = size / 2

    switch (shape.toLowerCase()) {
      case 'heart':
        this.drawHeart(ctx, center, center, size * 0.4)
        break
      case 'star':
        this.drawStar(ctx, center, center, 5, size * 0.4, size * 0.2)
        break
      case 'circle':
        ctx.beginPath()
        ctx.arc(center, center, size * 0.4, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'triangle':
        this.drawTriangle(ctx, center, center, size * 0.4)
        break
      case 'square':
        ctx.fillRect(center - size * 0.3, center - size * 0.3, size * 0.6, size * 0.6)
        break
      default:
        console.warn(`Unknown shape: ${shape}`)
        return new Float32Array(0)
    }

    return this.samplePixelsFromCanvas(canvas, ctx, maxPoints)
  }

  /**
   * 像素采样核心方法（使用独立 canvas，避免并发冲突）
   */
  private samplePixelsFromCanvas(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    maxPoints: number,
  ): Float32Array {
    const width = canvas.width
    const height = canvas.height

    if (width === 0 || height === 0) return new Float32Array(0)

    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // 收集所有非透明像素
    const points: [number, number][] = []

    for (let y = 0; y < height; y += SAMPLE_STEP) {
      for (let x = 0; x < width; x += SAMPLE_STEP) {
        const i = (y * width + x) * 4
        if (data[i + 3] > ALPHA_THRESHOLD) {
          points.push([x, y])
        }
      }
    }

    if (points.length === 0) return new Float32Array(0)

    // 采样
    const sampledPoints = points.length > maxPoints
      ? this.fisherYatesSample(points, maxPoints)
      : points

    return this.to3DPositions(sampledPoints, width, height)
  }

  /**
   * Fisher-Yates 随机采样（O(n) 时间，无碰撞问题）
   */
  private fisherYatesSample(points: [number, number][], count: number): [number, number][] {
    const n = points.length
    if (count >= n) return [...points]

    // 创建索引数组，部分洗牌
    const indices = Array.from({ length: n }, (_, i) => i)

    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(Math.random() * (n - i))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }

    return indices.slice(0, count).map(i => points[i])
  }

  /**
   * 将 2D Canvas 坐标转换为 3D 空间坐标
   */
  private to3DPositions(points: [number, number][], canvasWidth: number, canvasHeight: number): Float32Array {
    if (canvasHeight === 0) return new Float32Array(0)

    const positions = new Float32Array(points.length * 3)
    const aspectRatio = canvasWidth / canvasHeight

    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i]
      const i3 = i * 3

      const normalizedX = (x / canvasWidth) * 2 - 1
      const normalizedY = -((y / canvasHeight) * 2 - 1)

      positions[i3] = normalizedX * SHOW_RADIUS * aspectRatio
      positions[i3 + 1] = normalizedY * SHOW_RADIUS
      positions[i3 + 2] = (Math.random() - 0.5) * Z_DEPTH_RANGE
    }

    return positions
  }

  private drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    ctx.beginPath()
    const topY = cy - size * 0.5
    ctx.moveTo(cx, cy + size * 0.5)
    ctx.bezierCurveTo(cx - size, cy, cx - size, topY, cx, topY + size * 0.3)
    ctx.bezierCurveTo(cx + size, topY, cx + size, cy, cx, cy + size * 0.5)
    ctx.fill()
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3
    const step = Math.PI / spikes
    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius)
      rot += step
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
    ctx.fill()
  }

  private drawTriangle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    ctx.beginPath()
    ctx.moveTo(cx, cy - size)
    ctx.lineTo(cx - size * 0.866, cy + size * 0.5)
    ctx.lineTo(cx + size * 0.866, cy + size * 0.5)
    ctx.closePath()
    ctx.fill()
  }
}

// 导出单例
export const canvasSampler = new CanvasSampler()
