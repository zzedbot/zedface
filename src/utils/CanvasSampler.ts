// src/utils/CanvasSampler.ts

export interface SampleOptions {
  width?: number
  height?: number
  fontSize?: number
  fontFamily?: string
  color?: string
  maxPoints?: number
  size?: number // 用于图形的大小
  maxWidth?: number // 最大宽度（像素）
  maxHeight?: number // 最大高度（像素）
}

export class CanvasSampler {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  // 黄金比例
  private static readonly GOLDEN_RATIO = 0.618

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
  }

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
    const {
      fontSize = 100,
      fontFamily = 'Arial, sans-serif',
      color = '#ffffff',
      maxPoints = 12000,
    } = options

    const maxDisplay = this.getMaxDisplaySize()
    const maxWidth = options.maxWidth || maxDisplay.maxWidth
    const maxHeight = options.maxHeight || maxDisplay.maxHeight

    // 自动调整字体大小以适应最大尺寸
    let adjustedFontSize = fontSize
    let lines: string[] = [text]

    // 先尝试不换行的情况
    this.ctx.font = `bold ${adjustedFontSize}px ${fontFamily}`
    let textWidth = this.ctx.measureText(text).width

    // 如果文字太宽，尝试缩小字体
    if (textWidth > maxWidth) {
      adjustedFontSize = Math.floor(adjustedFontSize * (maxWidth / textWidth))
      this.ctx.font = `bold ${adjustedFontSize}px ${fontFamily}`
      textWidth = this.ctx.measureText(text).width
    }

    // 如果还是太宽，进行换行
    if (textWidth > maxWidth && text.length > 1) {
      lines = this.wrapText(text, adjustedFontSize, fontFamily, maxWidth)

      // 计算换行后的总高度
      const lineHeight = adjustedFontSize * 1.2
      const totalHeight = lines.length * lineHeight

      // 如果总高度超过最大高度，继续缩小字体
      if (totalHeight > maxHeight) {
        const scale = maxHeight / totalHeight
        adjustedFontSize = Math.floor(adjustedFontSize * scale)
        lines = this.wrapText(text, adjustedFontSize, fontFamily, maxWidth)
      }
    }

    // 计算 canvas 尺寸
    const lineHeight = adjustedFontSize * 1.2
    const canvasWidth = Math.ceil(maxWidth)
    const canvasHeight = Math.ceil(Math.max(lineHeight * 1.5, lines.length * lineHeight * 1.2))

    this.canvas.width = canvasWidth
    this.canvas.height = canvasHeight

    // 清空 canvas
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // 绘制文字（支持多行）
    this.ctx.fillStyle = color
    this.ctx.font = `bold ${adjustedFontSize}px ${fontFamily}`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    const startY = canvasHeight / 2 - ((lines.length - 1) * lineHeight) / 2
    lines.forEach((line, index) => {
      this.ctx.fillText(line, canvasWidth / 2, startY + index * lineHeight)
    })

    return this.samplePixels(maxPoints)
  }

  /**
   * 文字换行
   */
  private wrapText(text: string, fontSize: number, fontFamily: string, maxWidth: number): string[] {
    this.ctx.font = `bold ${fontSize}px ${fontFamily}`
    const lines: string[] = []
    let currentLine = ''

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const testLine = currentLine + char
      const testWidth = this.ctx.measureText(testLine).width

      if (testWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  /**
   * 采样 Emoji（支持自动缩放）
   */
  sampleEmoji(emoji: string, options: SampleOptions = {}): Float32Array {
    const {
      fontSize = 200,
      maxPoints = 12000,
    } = options

    const maxDisplay = this.getMaxDisplaySize()
    const maxWidth = options.maxWidth || maxDisplay.maxWidth
    const maxHeight = options.maxHeight || maxDisplay.maxHeight

    // 自动调整字体大小以适应最大尺寸
    let adjustedFontSize = fontSize
    this.ctx.font = `${adjustedFontSize}px serif`
    const metrics = this.ctx.measureText(emoji)
    const emojiWidth = metrics.width
    const emojiHeight = adjustedFontSize * 1.2 // 估算高度

    // 如果 emoji 太大，缩小字体
    if (emojiWidth > maxWidth || emojiHeight > maxHeight) {
      const scaleX = maxWidth / emojiWidth
      const scaleY = maxHeight / emojiHeight
      const scale = Math.min(scaleX, scaleY)
      adjustedFontSize = Math.floor(adjustedFontSize * scale)
    }

    const canvasSize = Math.ceil(adjustedFontSize * 1.5)

    this.canvas.width = canvasSize
    this.canvas.height = canvasSize

    this.ctx.clearRect(0, 0, canvasSize, canvasSize)
    this.ctx.font = `${adjustedFontSize}px serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(emoji, canvasSize / 2, canvasSize / 2)

    return this.samplePixels(maxPoints)
  }

  /**
   * 采样图片（支持 URL 和 Base64，自动缩放）
   */
  async sampleImage(source: string, options: SampleOptions = {}): Promise<Float32Array> {
    const {
      maxPoints = 12000,
    } = options

    const maxDisplay = this.getMaxDisplaySize()
    const maxWidth = options.maxWidth || maxDisplay.maxWidth
    const maxHeight = options.maxHeight || maxDisplay.maxHeight

    // 使用最大显示尺寸作为 canvas 尺寸
    const canvasWidth = Math.ceil(maxWidth)
    const canvasHeight = Math.ceil(maxHeight)

    this.canvas.width = canvasWidth
    this.canvas.height = canvasHeight
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    return new Promise((resolve, reject) => {
      const img = new Image()

      img.crossOrigin = 'anonymous' // 支持跨域图片

      img.onload = () => {
        // 计算缩放比例，保持宽高比，适应最大显示尺寸
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const x = (canvasWidth - scaledWidth) / 2
        const y = (canvasHeight - scaledHeight) / 2

        this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
        resolve(this.samplePixels(maxPoints))
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = source
    })
  }

  /**
   * 采样预定义图形
   */
  sampleShape(shape: string, options: SampleOptions = {}): Float32Array {
    const {
      size = 200,
      maxPoints = 6000,
    } = options

    this.canvas.width = size
    this.canvas.height = size
    this.ctx.clearRect(0, 0, size, size)
    this.ctx.fillStyle = '#ffffff'

    const center = size / 2

    switch (shape.toLowerCase()) {
      case 'heart':
        this.drawHeart(center, center, size * 0.4)
        break
      case 'star':
        this.drawStar(center, center, 5, size * 0.4, size * 0.2)
        break
      case 'circle':
        this.ctx.beginPath()
        this.ctx.arc(center, center, size * 0.4, 0, Math.PI * 2)
        this.ctx.fill()
        break
      case 'triangle':
        this.drawTriangle(center, center, size * 0.4)
        break
      case 'square':
        this.ctx.fillRect(center - size * 0.3, center - size * 0.3, size * 0.6, size * 0.6)
        break
      default:
        console.warn(`Unknown shape: ${shape}`)
        return new Float32Array(0)
    }

    return this.samplePixels(maxPoints)
  }

  /**
   * 像素采样核心方法
   */
  private samplePixels(maxPoints: number): Float32Array {
    const width = this.canvas.width
    const height = this.canvas.height
    const imageData = this.ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // 收集所有非透明像素
    const points: [number, number][] = []
    const alphaThreshold = 128 // alpha 阈值

    for (let y = 0; y < height; y += 2) { // 每 2 个像素采样一次，提高性能
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4
        const alpha = data[i + 3]

        if (alpha > alphaThreshold) {
          points.push([x, y])
        }
      }
    }

    // 如果点数超过最大值，随机采样
    let sampledPoints: [number, number][]
    if (points.length > maxPoints) {
      sampledPoints = this.randomSample(points, maxPoints)
    } else {
      sampledPoints = points
    }

    // 转换为 3D 坐标
    return this.to3DPositions(sampledPoints, width, height)
  }

  /**
   * 随机采样
   */
  private randomSample(points: [number, number][], count: number): [number, number][] {
    const sampled: [number, number][] = []
    const used = new Set<number>()

    while (sampled.length < count) {
      const index = Math.floor(Math.random() * points.length)
      if (!used.has(index)) {
        used.add(index)
        sampled.push(points[index])
      }
    }

    return sampled
  }

  /**
   * 将 2D Canvas 坐标转换为 3D 空间坐标
   */
  private to3DPositions(points: [number, number][], canvasWidth: number, canvasHeight: number): Float32Array {
    const positions = new Float32Array(points.length * 3)

    // 目标展示区域大小
    const showRadius = 3.0

    // 使用 canvas 的最大维度作为参考，保持比例
    const maxDimension = Math.max(canvasWidth, canvasHeight)

    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i]
      const i3 = i * 3

      // 归一化到 [-1, 1] 范围，使用最大维度保持一致的比例
      const normalizedX = ((x / maxDimension) * 2 - 1) * (canvasWidth / maxDimension)
      const normalizedY = -(((y / maxDimension) * 2 - 1) * (canvasHeight / maxDimension)) // Y 轴翻转

      // 映射到 3D 空间
      positions[i3] = normalizedX * showRadius
      positions[i3 + 1] = normalizedY * showRadius
      positions[i3 + 2] = (Math.random() - 0.5) * 0.2 // Z 轴轻微随机深度
    }

    return positions
  }

  /**
   * 绘制心形
   */
  private drawHeart(cx: number, cy: number, size: number) {
    this.ctx.beginPath()
    const topY = cy - size * 0.5

    this.ctx.moveTo(cx, cy + size * 0.5)

    // 左半部分
    this.ctx.bezierCurveTo(
      cx - size, cy,
      cx - size, topY,
      cx, topY + size * 0.3
    )

    // 右半部分
    this.ctx.bezierCurveTo(
      cx + size, topY,
      cx + size, cy,
      cx, cy + size * 0.5
    )

    this.ctx.fill()
  }

  /**
   * 绘制星形
   */
  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes

    this.ctx.beginPath()
    this.ctx.moveTo(cx, cy - outerRadius)

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      this.ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      this.ctx.lineTo(x, y)
      rot += step
    }

    this.ctx.lineTo(cx, cy - outerRadius)
    this.ctx.closePath()
    this.ctx.fill()
  }

  /**
   * 绘制三角形
   */
  private drawTriangle(cx: number, cy: number, size: number) {
    this.ctx.beginPath()
    this.ctx.moveTo(cx, cy - size)
    this.ctx.lineTo(cx - size * 0.866, cy + size * 0.5)
    this.ctx.lineTo(cx + size * 0.866, cy + size * 0.5)
    this.ctx.closePath()
    this.ctx.fill()
  }
}

// 导出单例
export const canvasSampler = new CanvasSampler()
