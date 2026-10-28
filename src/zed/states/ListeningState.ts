// src/zed/states/ListeningState.ts
// 3D 海胆球频谱：85% 外层频域刺 + 15% 内核有机球体

import { StateRegistry } from './StateRegistry'
import type { StateBehavior, StateContext } from './StateBehavior'

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const BAR_RATIO = 0.85
const MAX_SPIKE_HEIGHT = 1.0
const INNER_RADIUS_FACTOR = 0.3
const INNER_BOUNDARY_FACTOR = 0.9
const LERP_FACTOR = 0.35
const INNER_ROT_SPEED = 0.3

interface ListeningLayout {
  particleCount: number
  binCount: number
  barCount: number
  innerCount: number
  outerX: Float64Array
  outerY: Float64Array
  outerZ: Float64Array
  outerBin: Uint16Array
  outerBoost: Float64Array
  innerSinPhi: Float64Array
  innerCosPhi: Float64Array
  innerSinTheta: Float64Array
  innerCosTheta: Float64Array
}

let cachedLayout: ListeningLayout | null = null

function getLayout(particleCount: number, binCount: number): ListeningLayout {
  if (cachedLayout?.particleCount === particleCount && cachedLayout.binCount === binCount) {
    return cachedLayout
  }

  const barCount = Math.floor(particleCount * BAR_RATIO)
  const innerCount = particleCount - barCount
  const outerX = new Float64Array(barCount)
  const outerY = new Float64Array(barCount)
  const outerZ = new Float64Array(barCount)
  const outerBin = new Uint16Array(barCount)
  const outerBoost = new Float64Array(barCount)

  for (let i = 0; i < barCount; i++) {
    const cosPhi = 1 - 2 * (i + 0.5) / barCount
    const phi = Math.acos(cosPhi)
    const sinPhi = Math.sin(phi)
    const theta = GOLDEN_ANGLE * i
    outerX[i] = sinPhi * Math.cos(theta)
    outerY[i] = Math.cos(phi)
    outerZ[i] = sinPhi * Math.sin(theta)

    const binIndex = Math.min(Math.floor((Math.PI - phi) / Math.PI * binCount), binCount - 1)
    outerBin[i] = binIndex
    const hfBoost = 1.0 + (binIndex / binCount) * 2.0
    const lfEmphasis = 1.0 + Math.max(0, 1.0 - binIndex / 16) * 3.0
    outerBoost[i] = hfBoost * lfEmphasis
  }

  const innerSinPhi = new Float64Array(innerCount)
  const innerCosPhi = new Float64Array(innerCount)
  const innerSinTheta = new Float64Array(innerCount)
  const innerCosTheta = new Float64Array(innerCount)
  for (let innerIdx = 0; innerIdx < innerCount; innerIdx++) {
    const phi = Math.acos(1 - 2 * (innerIdx + 0.5) / innerCount)
    const theta = GOLDEN_ANGLE * (innerIdx + barCount)
    innerSinPhi[innerIdx] = Math.sin(phi)
    innerCosPhi[innerIdx] = Math.cos(phi)
    innerSinTheta[innerIdx] = Math.sin(theta)
    innerCosTheta[innerIdx] = Math.cos(theta)
  }

  cachedLayout = {
    particleCount, binCount, barCount, innerCount,
    outerX, outerY, outerZ, outerBin, outerBoost,
    innerSinPhi, innerCosPhi, innerSinTheta, innerCosTheta,
  }
  return cachedLayout
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

const listening: StateBehavior = {
  id: 'listening',
  label: '倾听中',
  color: '#ff6b6b',

  preset: {
    particleCount: 6000,
    particleSize: 15.0,
    particleSides: 0,
    radius: 1.5,
    animSpeed: 0.8,
    noiseAmplitude: 0,
    breathSpeed: 1.5,
    breathAmplitude: 0,
    rotationSpeed: 0.05,
    transitionSpeed: 0.08,
    colorMixSpeed: 0.5,
    glowIntensity: 0.6,
    alphaBase: 0.7,
    primaryColor: '#ff6b6b',
    secondaryColor: '#4ecdc4',
  },

  onEnter() {},
  onExit() {},

  update(ctx: StateContext): boolean {
    const { frequencyData } = ctx
    if (!frequencyData) return false

    const { positions, normals, randomness, particleCount, baseRadius, time } = ctx
    const binCount = frequencyData.length
    const layout = getLayout(particleCount, binCount)
    const { barCount } = layout
    const rotation = time * INNER_ROT_SPEED
    const sinRotation = Math.sin(rotation)
    const cosRotation = Math.cos(rotation)

    // 整体音量
    let totalAmp = 0
    for (let b = 0; b < binCount; b++) totalAmp += frequencyData[b]
    const avgAmp = totalAmp / binCount / 255

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const r1 = randomness[i]
      const r2 = randomness[(i * 7 + 3) % particleCount]

      let tx: number, ty: number, tz: number

      if (i < barCount) {
        // === 外层频谱刺（严格频域驱动，无 shader 效果）===
        const binIndex = layout.outerBin[i]
        const amplitude = frequencyData[binIndex] / 255
        const compensated = Math.min(amplitude * layout.outerBoost[i], 1.0)

        const radius = baseRadius + r1 * compensated * MAX_SPIKE_HEIGHT
        tx = radius * layout.outerX[i]
        ty = radius * layout.outerY[i]
        tz = radius * layout.outerZ[i]

        // 清零法线（屏蔽 shader 效果）
        normals[i3] = 0
        normals[i3 + 1] = 0
        normals[i3 + 2] = 0
      } else {
        // === 内核球体（有机效果：噪声 + 呼吸 + 音频缩放）===
        const innerIdx = i - barCount
        const maxR = baseRadius * INNER_RADIUS_FACTOR
        const baseR = Math.cbrt(r2) * maxR
        const sinPhi = layout.innerSinPhi[innerIdx]
        const cosTheta = layout.innerCosTheta[innerIdx] * cosRotation
          - layout.innerSinTheta[innerIdx] * sinRotation
        const sinTheta = layout.innerSinTheta[innerIdx] * cosRotation
          + layout.innerCosTheta[innerIdx] * sinRotation
        const nx = sinPhi * cosTheta
        const ny = layout.innerCosPhi[innerIdx]
        const nz = sinPhi * sinTheta

        let cx = baseR * nx
        let cy = baseR * ny
        let cz = baseR * nz

        // 噪声扰动
        const noiseVal = Math.sin(cx * 2.0 + time * 1.6) *
                         Math.cos(cy * 2.0 + time * 0.96) *
                         Math.sin(cz * 2.0 + time * 1.92)
        const nd = noiseVal * 0.25 * (1.0 + avgAmp * 1.5)
        cx += nx * nd
        cy += ny * nd
        cz += nz * nd

        // 呼吸脉动
        const breath = Math.sin(time * 3.0) * 0.08 + 1.0
        cx *= breath
        cy *= breath
        cz *= breath

        // 音频缩放
        const audioScale = 1.0 + avgAmp * 1.5 * 0.3
        cx *= audioScale
        cy *= audioScale
        cz *= audioScale

        // 限制不超出外层
        const dist = Math.sqrt(cx * cx + cy * cy + cz * cz)
        if (dist > baseRadius * INNER_BOUNDARY_FACTOR) {
          const s = (baseRadius * INNER_BOUNDARY_FACTOR) / dist
          cx *= s
          cy *= s
          cz *= s
        }

        tx = cx
        ty = cy
        tz = cz
        normals[i3] = nx
        normals[i3 + 1] = ny
        normals[i3 + 2] = nz
      }

      // lerp 平滑过渡
      positions[i3] = lerp(positions[i3], tx, LERP_FACTOR)
      positions[i3 + 1] = lerp(positions[i3 + 1], ty, LERP_FACTOR)
      positions[i3 + 2] = lerp(positions[i3 + 2], tz, LERP_FACTOR)
    }

    return true
  },
}

StateRegistry.register(listening)
