// src/zed/FluidParticles.ts

import * as THREE from 'three'
import { vertexShader, fragmentShader } from './shaders'
import type { FluidParams } from '../components/ControlPanel'
import { logger } from '../utils/Logger'

// 简单的线性插值
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// 十六进制颜色转 RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0.306, g: 0.804, b: 0.769 } // fallback to #4ecdc4
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  }
}

export class FluidParticles {
  private scene: THREE.Scene
  private particles: THREE.Points | null = null
  private uniforms: { [key: string]: THREE.IUniform } = {}

  // 目标参数和当前插值参数
  private targetParams: FluidParams
  private currentParams: FluidParams

  // 粒子方向向量（用于半径变化时的平滑过渡）
  private particleDirections: Float32Array | null = null

  // 展示模式相关
  private showTargetPositions: Float32Array | null = null
  private isShowMode: boolean = false
  private showTransitionProgress: number = 0
  private isExitingShowMode: boolean = false // 标记是否正在退出展示模式
  private sphereTargetPositions: Float32Array | null = null // 退出展示模式时的球体目标位置

  // 进入展示模式相关（等待参数过渡完成）
  private isEnteringShowMode: boolean = false
  private pendingShowPositions: Float32Array | null = null

  // 监听模式相关（音频环形波器）
  private isListeningMode: boolean = false
  private frequencyData: Uint8Array | null = null

  constructor(scene: THREE.Scene, params: FluidParams) {
    this.scene = scene
    this.targetParams = { ...params }
    this.currentParams = { ...params }
    this.createParticles()
  }

  private createParticles() {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(this.currentParams.particleCount * 3)
    const normals = new Float32Array(this.currentParams.particleCount * 3)
    const scales = new Float32Array(this.currentParams.particleCount)
    const randomness = new Float32Array(this.currentParams.particleCount)

    // 初始化方向向量数组
    this.particleDirections = new Float32Array(this.currentParams.particleCount * 3)

    for (let i = 0; i < this.currentParams.particleCount; i++) {
      const i3 = i * 3

      // Sphere distribution
      const radius = this.currentParams.radius
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      // 保存方向向量（单位向量）
      const dx = Math.sin(phi) * Math.cos(theta)
      const dy = Math.sin(phi) * Math.sin(theta)
      const dz = Math.cos(phi)
      this.particleDirections[i3] = dx
      this.particleDirections[i3 + 1] = dy
      this.particleDirections[i3 + 2] = dz

      // 使用方向向量计算位置
      positions[i3] = radius * dx
      positions[i3 + 1] = radius * dy
      positions[i3 + 2] = radius * dz

      // Normals (pointing outward)
      normals[i3] = dx
      normals[i3 + 1] = dy
      normals[i3 + 2] = dz

      scales[i] = Math.random() * 2 + 0.5
      randomness[i] = Math.random()
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 1))

    this.uniforms = {
      uTime: { value: 0 },
      uAudioIntensity: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uAnimSpeed: { value: this.currentParams.animSpeed },
      uBreathSpeed: { value: this.currentParams.breathSpeed },
      uBreathAmplitude: { value: this.currentParams.breathAmplitude },
      uNoiseAmplitude: { value: this.currentParams.noiseAmplitude },
      uColorMixSpeed: { value: this.currentParams.colorMixSpeed },
      uGlowIntensity: { value: this.currentParams.glowIntensity },
      uAlphaBase: { value: this.currentParams.alphaBase },
      uParticleSize: { value: this.currentParams.particleSize },
      uParticleSides: { value: this.currentParams.particleSides },
      uPrimaryColor: { value: new THREE.Vector3(
        ...Object.values(hexToRgb(this.currentParams.primaryColor))
      ) },
      uSecondaryColor: { value: new THREE.Vector3(
        ...Object.values(hexToRgb(this.currentParams.secondaryColor))
      ) },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.particles = new THREE.Points(geometry, material)
    this.scene.add(this.particles)
  }

  update(time: number, audioIntensity: number = 0) {
    this.uniforms.uTime.value = time
    this.uniforms.uAudioIntensity.value = audioIntensity

    // 使用简单的线性插值，让过渡速度真正可控
    // transitionSpeed 表示每帧移动的比例（0.01 = 1%，需要约100帧 = 1.67秒）
    const transitionSpeed = this.targetParams.transitionSpeed || 0.08

    // 对于关键参数（如半径），使用稍快的速度
    this.currentParams.radius = lerp(this.currentParams.radius, this.targetParams.radius, transitionSpeed * 1.5)
    this.currentParams.particleSize = lerp(this.currentParams.particleSize, this.targetParams.particleSize, transitionSpeed * 1.2)

    // 其他参数使用标准速度
    this.currentParams.animSpeed = lerp(this.currentParams.animSpeed, this.targetParams.animSpeed, transitionSpeed)
    this.currentParams.breathSpeed = lerp(this.currentParams.breathSpeed, this.targetParams.breathSpeed, transitionSpeed)
    this.currentParams.breathAmplitude = lerp(this.currentParams.breathAmplitude, this.targetParams.breathAmplitude, transitionSpeed)
    this.currentParams.noiseAmplitude = lerp(this.currentParams.noiseAmplitude, this.targetParams.noiseAmplitude, transitionSpeed)
    this.currentParams.rotationSpeed = lerp(this.currentParams.rotationSpeed, this.targetParams.rotationSpeed, transitionSpeed)
    this.currentParams.colorMixSpeed = lerp(this.currentParams.colorMixSpeed, this.targetParams.colorMixSpeed, transitionSpeed)
    this.currentParams.glowIntensity = lerp(this.currentParams.glowIntensity, this.targetParams.glowIntensity, transitionSpeed)
    this.currentParams.alphaBase = lerp(this.currentParams.alphaBase, this.targetParams.alphaBase, transitionSpeed)

    // 颜色参数直接更新（不插值）
    this.currentParams.primaryColor = this.targetParams.primaryColor
    this.currentParams.secondaryColor = this.targetParams.secondaryColor

    // 对于需要重建的属性（粒子数量、形状），使用阈值判断是否更新
    const countDiff = Math.abs(this.currentParams.particleCount - this.targetParams.particleCount)
    const sidesDiff = Math.abs(this.currentParams.particleSides - this.targetParams.particleSides)
    const radiusChanged = Math.abs(this.currentParams.radius - this.targetParams.radius) > 0.01

    // 如果粒子数量或形状差异足够大，立即重建
    if (countDiff > 100 || sidesDiff > 0.5) {
      this.currentParams.particleCount = this.targetParams.particleCount
      this.currentParams.particleSides = this.targetParams.particleSides

      // 重建粒子
      if (this.particles) {
        this.particles.geometry.dispose()
        ;(this.particles.material as THREE.Material).dispose()
        this.scene.remove(this.particles)
      }
      this.createParticles()
    }
    // 如果半径变化了，更新粒子位置
    else if (radiusChanged && this.particles && this.particleDirections) {
      const posAttr = this.particles.geometry.attributes.position
      const positions = posAttr.array as Float32Array
      const radius = this.currentParams.radius

      for (let i = 0; i < this.currentParams.particleCount; i++) {
        const i3 = i * 3
        positions[i3] = radius * this.particleDirections[i3]
        positions[i3 + 1] = radius * this.particleDirections[i3 + 1]
        positions[i3 + 2] = radius * this.particleDirections[i3 + 2]
      }
      posAttr.needsUpdate = true
    }

    // 更新 shader uniforms
    this.uniforms.uAnimSpeed.value = this.currentParams.animSpeed
    this.uniforms.uBreathSpeed.value = this.currentParams.breathSpeed
    this.uniforms.uBreathAmplitude.value = this.currentParams.breathAmplitude
    this.uniforms.uNoiseAmplitude.value = this.currentParams.noiseAmplitude
    this.uniforms.uColorMixSpeed.value = this.currentParams.colorMixSpeed
    this.uniforms.uGlowIntensity.value = this.currentParams.glowIntensity
    this.uniforms.uAlphaBase.value = this.currentParams.alphaBase
    this.uniforms.uParticleSize.value = this.currentParams.particleSize
    this.uniforms.uParticleSides.value = this.currentParams.particleSides

    // 更新颜色 uniforms
    const primaryRgb = hexToRgb(this.currentParams.primaryColor)
    const secondaryRgb = hexToRgb(this.currentParams.secondaryColor)
    this.uniforms.uPrimaryColor.value.set(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    this.uniforms.uSecondaryColor.value.set(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)

    // 进入展示模式处理（等待参数过渡完成后开始位置过渡）
    if (this.isEnteringShowMode && this.pendingShowPositions && this.particles) {
      // 检查参数是否已经过渡完成
      const paramsTransitioned =
        Math.abs(this.currentParams.radius - this.targetParams.radius) < 0.01 &&
        Math.abs(this.currentParams.particleSize - this.targetParams.particleSize) < 0.1

      if (paramsTransitioned) {
        logger.log(`[FluidParticles] Params transitioned at time: ${time.toFixed(2)}, starting position transition to show content`)
        // 参数过渡完成，开始位置过渡
        this.showTargetPositions = this.pendingShowPositions
        this.isShowMode = true
        this.isEnteringShowMode = false
        this.pendingShowPositions = null
        this.showTransitionProgress = 0
      } else {
        // 参数还在过渡中，保持当前状态
        this.particles.rotation.y = time * this.currentParams.rotationSpeed
      }
    }
    // 展示模式处理
    else if (this.isShowMode && this.showTargetPositions && this.particles) {
      // 逐渐增加过渡进度
      this.showTransitionProgress = Math.min(1, this.showTransitionProgress + 0.02)

      const posAttr = this.particles.geometry.attributes.position
      const positions = posAttr.array as Float32Array

      // 粒子向目标位置过渡
      // 使用用户控制的过渡速度（与参数过渡速度相同）
      const positionTransitionSpeed = this.targetParams.transitionSpeed || 0.08
      for (let i = 0; i < this.currentParams.particleCount; i++) {
        const i3 = i * 3
        const targetIndex = (i % (this.showTargetPositions.length / 3)) * 3

        positions[i3] = lerp(positions[i3], this.showTargetPositions[targetIndex], positionTransitionSpeed)
        positions[i3 + 1] = lerp(positions[i3 + 1], this.showTargetPositions[targetIndex + 1], positionTransitionSpeed)
        positions[i3 + 2] = lerp(positions[i3 + 2], this.showTargetPositions[targetIndex + 2], positionTransitionSpeed)
      }
      posAttr.needsUpdate = true

      // 在展示模式下减少旋转
      this.particles.rotation.y = time * this.currentParams.rotationSpeed * 0.1
    }
    // 监听模式：音频环形波器
    else if (this.isListeningMode && this.frequencyData && this.particles) {
      this.updateListeningRing(time)
    }
    else if (this.particles) {
      // 非展示模式：正常球体行为
      // 如果刚从展示模式退出，先等参数过渡完成，再开始位置过渡
      if (this.isExitingShowMode) {
        // 检查参数是否已经过渡完成
        const paramsTransitioned =
          Math.abs(this.currentParams.radius - this.targetParams.radius) < 0.01 &&
          Math.abs(this.currentParams.particleSize - this.targetParams.particleSize) < 0.1

        if (paramsTransitioned && !this.sphereTargetPositions) {
          // 参数过渡完成后，用当前参数计算球体目标位置
          logger.log(`[FluidParticles] Params transitioned at time: ${time.toFixed(2)}, calculating sphere with currentRadius: ${this.currentParams.radius.toFixed(3)}`)
          this.sphereTargetPositions = new Float32Array(this.currentParams.particleCount * 3)
          const radius = this.currentParams.radius // 使用当前半径（已接近目标）

          for (let i = 0; i < this.currentParams.particleCount; i++) {
            const i3 = i * 3
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(Math.random() * 2 - 1)

            this.sphereTargetPositions[i3] = radius * Math.sin(phi) * Math.cos(theta)
            this.sphereTargetPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            this.sphereTargetPositions[i3 + 2] = radius * Math.cos(phi)
          }
        }

        if (this.sphereTargetPositions) {
          // 粒子向球体目标位置过渡
          const posAttr = this.particles.geometry.attributes.position
          const positions = posAttr.array as Float32Array
          // 使用用户控制的过渡速度（与参数过渡速度相同）
          const positionTransitionSpeed = this.targetParams.transitionSpeed || 0.08
          let allTransitioned = true

          for (let i = 0; i < this.currentParams.particleCount; i++) {
            const i3 = i * 3

            positions[i3] = lerp(positions[i3], this.sphereTargetPositions[i3], positionTransitionSpeed)
            positions[i3 + 1] = lerp(positions[i3 + 1], this.sphereTargetPositions[i3 + 1], positionTransitionSpeed)
            positions[i3 + 2] = lerp(positions[i3 + 2], this.sphereTargetPositions[i3 + 2], positionTransitionSpeed)

            // 检查是否所有粒子都已过渡完成
            const dx = positions[i3] - this.sphereTargetPositions[i3]
            const dy = positions[i3 + 1] - this.sphereTargetPositions[i3 + 1]
            const dz = positions[i3 + 2] - this.sphereTargetPositions[i3 + 2]
            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01 || Math.abs(dz) > 0.01) {
              allTransitioned = false
            }
          }
          posAttr.needsUpdate = true

          // 位置过渡完成后清理
          if (allTransitioned) {
            logger.log(`[FluidParticles] Position transition complete at time: ${time.toFixed(2)}`)
            this.isExitingShowMode = false
            this.sphereTargetPositions = null
          }
        }
      }

      this.particles.rotation.y = time * this.currentParams.rotationSpeed
    }
  }

  // 设置目标参数（触发平滑过渡）
  setTargetParams(params: FluidParams) {
    logger.log(`[FluidParticles] setTargetParams called, animSpeed: ${params.animSpeed}, noiseAmplitude: ${params.noiseAmplitude}, radius: ${params.radius}, size: ${params.particleSize}`)
    this.targetParams = { ...params }
  }

  // 立即设置参数（无过渡，用于控制面板手动调整）
  updateParams(params: FluidParams) {
    this.targetParams = { ...params }
    this.currentParams = { ...params }

    // 立即更新 uniforms
    this.uniforms.uAnimSpeed.value = params.animSpeed
    this.uniforms.uBreathSpeed.value = params.breathSpeed
    this.uniforms.uBreathAmplitude.value = params.breathAmplitude
    this.uniforms.uNoiseAmplitude.value = params.noiseAmplitude
    this.uniforms.uColorMixSpeed.value = params.colorMixSpeed
    this.uniforms.uGlowIntensity.value = params.glowIntensity
    this.uniforms.uAlphaBase.value = params.alphaBase
    this.uniforms.uParticleSize.value = params.particleSize
    this.uniforms.uParticleSides.value = params.particleSides

    // 更新颜色 uniforms
    const primaryRgb = hexToRgb(params.primaryColor)
    const secondaryRgb = hexToRgb(params.secondaryColor)
    this.uniforms.uPrimaryColor.value.set(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    this.uniforms.uSecondaryColor.value.set(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)

    // 重建粒子
    if (this.particles) {
      this.particles.geometry.dispose()
      ;(this.particles.material as THREE.Material).dispose()
      this.scene.remove(this.particles)
    }
    this.createParticles()
  }

  /**
   * 设置展示内容（进入"等待参数过渡"状态）
   */
  setShowContent(positions: Float32Array): void {
    logger.log(`[FluidParticles] setShowContent called with ${positions.length / 3} points, entering "waiting for params" state`)

    // 保存展示位置，但不立即进入展示模式
    this.pendingShowPositions = positions
    this.isEnteringShowMode = true
    this.isShowMode = false
    this.showTransitionProgress = 0
    this.isExitingShowMode = false
  }

  /**
   * 取消展示（清除待展示的位置数据）
   */
  cancelShow(): void {
    logger.log(`[FluidParticles] Canceling show mode`)
    this.pendingShowPositions = null
    this.isEnteringShowMode = false
  }

  /**
   * 退出展示模式
   */
  exitShowMode(): void {
    logger.log(`[FluidParticles] Exiting show mode, currentRadius: ${this.currentParams.radius.toFixed(3)}, targetRadius: ${this.targetParams.radius.toFixed(3)}, currentSize: ${this.currentParams.particleSize.toFixed(3)}, targetSize: ${this.targetParams.particleSize.toFixed(3)}`)
    this.isShowMode = false
    this.showTransitionProgress = 0
    this.isExitingShowMode = true
    this.isEnteringShowMode = false
    this.pendingShowPositions = null
  }

  /**
   * 检查是否在展示模式
   */
  isInShowMode(): boolean {
    return this.isShowMode
  }

  /**
   * 更新频域数据（从 ZedAvatar animate loop 每帧调用）
   * 传入非 null 数据时进入监听模式，传入 null 时退出
   */
  updateFrequencyData(data: Uint8Array | null): void {
    if (data && data.length > 0) {
      this.isListeningMode = true
      this.frequencyData = data
    } else {
      this.isListeningMode = false
      this.frequencyData = null
    }
  }

  /**
   * 监听模式：将粒子排列为环，频域数据驱动半径变形
   */
  private updateListeningRing(time: number): void {
    if (!this.particles || !this.frequencyData) return

    const posAttr = this.particles.geometry.attributes.position
    const positions = posAttr.array as Float32Array
    const randAttr = this.particles.geometry.attributes.aRandomness
    const randomness = randAttr.array as Float32Array

    const count = this.currentParams.particleCount
    const binCount = this.frequencyData.length
    const baseRadius = this.currentParams.radius
    const maxSpikeHeight = 3.0

    // 70% 粒子用于频谱柱，30% 用于内部散落
    const barCount = Math.floor(count * 0.7)
    const particlesPerBin = barCount / binCount

    // 计算整体音量（内部粒子响应）
    let totalAmp = 0
    for (let b = 0; b < binCount; b++) totalAmp += this.frequencyData[b]
    const avgAmp = totalAmp / binCount / 255

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const r1 = randomness[i]
      const r2 = randomness[(i * 7 + 3) % count]

      let targetX: number, targetY: number

      if (i < barCount) {
        // === 频谱柱粒子 ===
        const binIndex = Math.floor(i / particlesPerBin)
        const clampedBin = Math.min(binIndex, binCount - 1)
        const amplitude = this.frequencyData[clampedBin] / 255
        const binAngle = ((clampedBin + 0.5) / binCount) * Math.PI * 2

        // 粒子在柱内的径向位置 (0=基础环, 1=柱顶)
        const localIndex = i - binIndex * particlesPerBin
        const t = localIndex / particlesPerBin
        const radius = baseRadius + t * amplitude * maxSpikeHeight

        // 柱子角宽度
        const angle = binAngle + (r1 - 0.5) * 0.02
        targetX = radius * Math.cos(angle)
        targetY = radius * Math.sin(angle)
      } else {
        // === 内部散落粒子 ===
        const innerIdx = i - barCount
        const goldenAngle = Math.PI * (3 - Math.sqrt(5))
        const angle = innerIdx * goldenAngle

        // 基础半径内分布
        const maxR = baseRadius * 0.8
        const baseR = Math.sqrt(r1) * maxR

        // 呼吸（温和）
        const breath = Math.sin(time * 1.2 + r2 * Math.PI * 2) * 0.1

        // 噪声（轻微扰动）
        const noiseX = Math.sin(time * 0.8 + r1 * 12.56) * 0.04
          + Math.sin(time * 1.7 + r2 * 9.42) * 0.02
        const noiseY = Math.cos(time * 0.9 + r2 * 11.0) * 0.04
          + Math.cos(time * 1.5 + r1 * 8.0) * 0.02

        // 音频响应
        const audioPush = avgAmp * 0.15

        let radius = baseR * (1.0 + breath + audioPush)

        // 限制不超出圆环半径
        radius = Math.min(radius, baseRadius * 0.95)

        targetX = radius * Math.cos(angle) + noiseX
        targetY = radius * Math.sin(angle) + noiseY
      }

      // lerp 平滑过渡
      positions[i3] = lerp(positions[i3], targetX, 0.35)
      positions[i3 + 1] = lerp(positions[i3 + 1], targetY, 0.35)
      positions[i3 + 2] = lerp(positions[i3 + 2], 0, 0.35)
    }
    posAttr.needsUpdate = true
  }

  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose()
      ;(this.particles.material as THREE.Material).dispose()
      this.scene.remove(this.particles)
    }
  }
}
