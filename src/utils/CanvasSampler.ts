// src/utils/CanvasSampler.ts

export interface SampleOptions {
  width?: number
  height?: number
  fontSize?: number
  fontFamily?: string
  color?: string
  maxPoints?: number
  size?: number // 用于图形的大小
}

export class CanvasSampler {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
  }

  /**
   * 采样文字
   */
  sampleText(text: string, options: SampleOptions = {}): Float32Array {
    const {
      fontSize = 100,
      fontFamily = 'Arial, sans-serif',
      color = '#ffffff',
      maxPoints = 6000,
    } = options

    // 设置 canvas 尺寸
    const canvasWidth = options.width || Math.max(400, text.length * fontSize * 0.6)
    const canvasHeight = options.height || fontSize * 1.5

    this.canvas.width = canvasWidth
    this.canvas.height = canvasHeight

    // 清空 canvas
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // 绘制文字
    this.ctx.fillStyle = color
    this.ctx.font = `bold ${fontSize}px ${fontFamily}`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(text, canvasWidth / 2, canvasHeight / 2)

    return this.samplePixels(maxPoints)
  }

  /**
   * 采样 Emoji
   */
  sampleEmoji(emoji: string, options: SampleOptions = {}): Float32Array {
    const {
      fontSize = 200,
      maxPoints = 6000,
    } = options

    const canvasSize = options.width || fontSize * 1.2

    this.canvas.width = canvasSize
    this.canvas.height = canvasSize

    this.ctx.clearRect(0, 0, canvasSize, canvasSize)
    this.ctx.font = `${fontSize}px serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(emoji, canvasSize / 2, canvasSize / 2)

    return this.samplePixels(maxPoints)
  }

  /**
   * 采样图片（支持 URL 和 Base64）
   */
  async sampleImage(source: string, options: SampleOptions = {}): Promise<Float32Array> {
    const {
      width = 300,
      height = 300,
      maxPoints = 6000,
    } = options

    this.canvas.width = width
    this.canvas.height = height
    this.ctx.clearRect(0, 0, width, height)

    return new Promise((resolve, reject) => {
      const img = new Image()

      img.crossOrigin = 'anonymous' // 支持跨域图片

      img.onload = () => {
        // 计算缩放比例，保持宽高比
        const scale = Math.min(width / img.width, height / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const x = (width - scaledWidth) / 2
        const y = (height - scaledHeight) / 2

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
    const aspectRatio = canvasWidth / canvasHeight

    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i]
      const i3 = i * 3

      // 归一化到 [-1, 1] 范围
      const normalizedX = (x / canvasWidth) * 2 - 1
      const normalizedY = -((y / canvasHeight) * 2 - 1) // Y 轴翻转

      // 映射到 3D 空间
      positions[i3] = normalizedX * showRadius * aspectRatio
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
