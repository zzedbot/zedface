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

/** 采样结果：包含位置（必须）和颜色（可选） */
export interface SampleResult {
  positions: Float32Array
  colors: Float32Array | null
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
  sampleText(text: string, options: SampleOptions = {}): SampleResult {
    // 空输入保护
    if (!text || !text.trim()) {
      return { positions: new Float32Array(0), colors: null }
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
      return { positions: new Float32Array(0), colors: null }
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

    const positions = this.samplePixelsFromCanvas(canvas, ctx, maxPoints)
    return { positions, colors: null }
  }

  /**
   * 将 emoji 转换为 Twemoji SVG URL
   * 例如：🙂 → https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f642.svg
   */
  private emojiToTwemojiUrl(emoji: string): string {
    const TWEJSON_CDN = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/'

    // 将 emoji 转换为 code point 序列
    const codePoints: string[] = []
    for (const char of emoji) {
      const code = char.codePointAt(0)
      if (code === undefined) continue
      // 跳过变体选择器 (FE0E, FE0F) 和 ZWJ (200D) 保留用于组合
      if (code === 0xFE0E || code === 0xFE0F) continue
      codePoints.push(code.toString(16))
    }

    if (codePoints.length === 0) return ''

    const filename = codePoints.join('-') + '.svg'
    return TWEJSON_CDN + filename
  }

  /**
   * 采样 Emoji（使用 Twemoji CDN 渲染，通过边缘检测提取五官细节）
   */
  async sampleEmoji(emoji: string, options: SampleOptions = {}): Promise<SampleResult> {
    if (!emoji) return { positions: new Float32Array(0), colors: null }

    const { fontSize = 200, maxPoints = 12000 } = options
    const maxDisplay = this.getMaxDisplaySize()
    const maxWidth = options.maxWidth || maxDisplay.maxWidth
    const maxHeight = options.maxHeight || maxDisplay.maxHeight

    // 使用较大画布以提高边缘检测精度
    const canvasSize = Math.ceil(Math.min(fontSize * 1.5, maxWidth, maxHeight))

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    canvas.width = canvasSize
    canvas.height = canvasSize

    // 尝试使用 Twemoji SVG 渲染
    const twemojiUrl = this.emojiToTwemojiUrl(emoji)

    if (twemojiUrl) {
      try {
        const img = await this.loadImage(twemojiUrl, 10000)
        // 居中绘制，留出边距
        const padding = canvasSize * 0.1
        const drawSize = canvasSize - padding * 2
        ctx.drawImage(img, padding, padding, drawSize, drawSize)
        // 使用边缘检测采样（而非普通 alpha 采样）
        return this.sampleEmojiPixels(canvas, ctx, maxPoints)
      } catch (error) {
        console.warn('[CanvasSampler] Twemoji load failed, falling back to fillText:', error)
      }
    }

    // Fallback: 使用原生 fillText
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, canvasSize / 2, canvasSize / 2)

    return this.sampleEmojiPixels(canvas, ctx, maxPoints)
  }

  /**
   * Emoji 专用采样：边缘检测 + 非透明区域 + 颜色采集
   * 在颜色突变处（五官轮廓）密集采样，在均匀区域稀疏采样
   */
  private sampleEmojiPixels(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    maxPoints: number,
  ): SampleResult {
    const width = canvas.width
    const height = canvas.height
    if (width === 0 || height === 0) return { positions: new Float32Array(0), colors: null }

    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // 计算每个像素的亮度
    const luminance = new Float32Array(width * height)
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      const a = data[i * 4 + 3]
      // 亮度 = 颜色亮度 * alpha（透明区域亮度为 0）
      luminance[i] = (0.299 * r + 0.587 * g + 0.114 * b) * (a / 255)
    }

    // 边缘检测：计算每个像素与邻域的亮度差
    const EDGE_THRESHOLD = 30  // 亮度差阈值
    const step = SAMPLE_STEP
    const edgePoints: [number, number, number, number, number, number][] = [] // [x, y, edgeStrength, r, g, b]
    const fillPoints: [number, number, number, number, number][] = [] // [x, y, r, g, b]

    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const idx = y * width + x
        const alpha = data[idx * 4 + 3]
        if (alpha < ALPHA_THRESHOLD) continue

        const r = data[idx * 4] / 255
        const g = data[idx * 4 + 1] / 255
        const b = data[idx * 4 + 2] / 255
        const center = luminance[idx]

        // 采样 4 个方向的邻域
        const up = luminance[(y - step) * width + x]
        const down = luminance[(y + step) * width + x]
        const left = luminance[y * width + (x - step)]
        const right = luminance[y * width + (x + step)]

        // 最大亮度差 = 边缘强度
        const edgeStrength = Math.max(
          Math.abs(center - up),
          Math.abs(center - down),
          Math.abs(center - left),
          Math.abs(center - right),
        )

        if (edgeStrength > EDGE_THRESHOLD) {
          // 边缘点（五官轮廓）—— 加入高权重
          edgePoints.push([x, y, edgeStrength, r, g, b])
        } else {
          // 均匀区域（脸部填充）—— 低权重
          fillPoints.push([x, y, r, g, b])
        }
      }
    }

    // 分配粒子配额：70% 给边缘，30% 给填充区域
    const edgeQuota = Math.floor(maxPoints * 0.7)
    const fillQuota = maxPoints - edgeQuota

    let edgeSampled: [number, number, number, number, number][]
    if (edgePoints.length > edgeQuota) {
      // 按边缘强度加权采样
      edgeSampled = this.weightedSampleWithColor(edgePoints, edgeQuota)
    } else {
      edgeSampled = edgePoints.map(([x, y, , r, g, b]) => [x, y, r, g, b])
    }

    let fillSampled: [number, number, number, number, number][]
    if (fillPoints.length > fillQuota) {
      fillSampled = this.fisherYatesSampleWithColor(fillPoints, fillQuota)
    } else {
      fillSampled = fillPoints
    }

    const allPoints = [...edgeSampled, ...fillSampled]
    if (allPoints.length === 0) return { positions: new Float32Array(0), colors: null }

    // 构建位置和颜色数组
    const positions = new Float32Array(allPoints.length * 3)
    const colors = new Float32Array(allPoints.length * 3)

    for (let i = 0; i < allPoints.length; i++) {
      const [x, y, r, g, b] = allPoints[i]
      const i3 = i * 3

      // 转换为 3D 坐标
      const normalizedX = (x / width) * 2 - 1
      const normalizedY = -((y / height) * 2 - 1)
      const aspectRatio = width / height

      positions[i3] = normalizedX * SHOW_RADIUS * aspectRatio
      positions[i3 + 1] = normalizedY * SHOW_RADIUS
      positions[i3 + 2] = (Math.random() - 0.5) * Z_DEPTH_RANGE

      // 存储颜色
      colors[i3] = r
      colors[i3 + 1] = g
      colors[i3 + 2] = b
    }

    return { positions, colors }
  }

  /**
   * 按权重采样（边缘强度越高越优先）- 带颜色
   */
  private weightedSampleWithColor(
    points: [number, number, number, number, number, number][],
    count: number,
  ): [number, number, number, number, number][] {
    // 按权重排序，取前 N 个
    const sorted = [...points].sort((a, b) => b[2] - a[2])
    return sorted.slice(0, count).map(([x, y, , r, g, b]) => [x, y, r, g, b])
  }

  /**
   * Fisher-Yates 采样 - 带颜色
   */
  private fisherYatesSampleWithColor(
    points: [number, number, number, number, number][],
    count: number,
  ): [number, number, number, number, number][] {
    const n = points.length
    if (count >= n) return [...points]

    const indices = Array.from({ length: n }, (_, i) => i)
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(Math.random() * (n - i))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }

    return indices.slice(0, count).map(i => points[i])
  }

  /**
   * 加载图片并返回 Promise
   */
  private loadImage(src: string, timeoutMs: number = 10000): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      const timeout = setTimeout(() => {
        img.src = ''
        reject(new Error('Image load timeout'))
      }, timeoutMs)

      img.onload = () => {
        clearTimeout(timeout)
        resolve(img)
      }

      img.onerror = () => {
        clearTimeout(timeout)
        reject(new Error(`Failed to load image: ${src}`))
      }

      img.src = src
    })
  }

  /**
   * 采样图片
   */
  async sampleImage(source: string, options: SampleOptions = {}): Promise<SampleResult> {
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
        const positions = this.samplePixelsFromCanvas(canvas, ctx, maxPoints)
        resolve({ positions, colors: null })
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
  sampleShape(shape: string, options: SampleOptions = {}): SampleResult {
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
        return { positions: new Float32Array(0), colors: null }
    }

    const positions = this.samplePixelsFromCanvas(canvas, ctx, maxPoints)
    return { positions, colors: null }
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
