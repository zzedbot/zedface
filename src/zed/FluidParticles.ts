// src/zed/FluidParticles.ts

import * as THREE from 'three'
import { vertexShader, fragmentShader } from './shaders'
import type { FluidParams } from '../types'
import type { StateBehavior, StateContext } from './states/StateBehavior'
import { StateRegistry } from './states/StateRegistry'
import { logger } from '../utils/Logger'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0.306, g: 0.804, b: 0.769 }
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

  private targetParams: FluidParams
  private currentParams: FluidParams

  // 粒子方向向量（初始球体分布，用于球体恢复）
  private particleDirections: Float32Array | null = null

  // 状态系统
  private currentState: StateBehavior | null = null
  private previousStateId: string | null = null
  private lastUpdateReturnedTrue: boolean = false
  private needsSphereRecovery: boolean = false

  // 外部数据（通过 StateContext 暴露给状态行为）
  private frequencyData: Uint8Array | null = null
  private showPositions: Float32Array | null = null
  private showColors: Float32Array | null = null
  private audioIntensity: number = 0
  private userRotationY: number = 0

  constructor(scene: THREE.Scene, params: FluidParams) {
    this.scene = scene
    this.targetParams = { ...params }
    this.currentParams = { ...params }
    this.createParticles()
  }

  private createParticles() {
    const geometry = new THREE.BufferGeometry()
    const count = this.currentParams.particleCount
    const positions = new Float32Array(count * 3)
    const normals = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const randomness = new Float32Array(count)

    this.particleDirections = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const radius = this.currentParams.radius
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      const dx = Math.sin(phi) * Math.cos(theta)
      const dy = Math.sin(phi) * Math.sin(theta)
      const dz = Math.cos(phi)
      this.particleDirections[i3] = dx
      this.particleDirections[i3 + 1] = dy
      this.particleDirections[i3 + 2] = dz

      positions[i3] = radius * dx
      positions[i3 + 1] = radius * dy
      positions[i3 + 2] = radius * dz

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
      uAnimSpeed: { value: this.currentParams.animSpeed },
      uBreathSpeed: { value: this.currentParams.breathSpeed },
      uBreathAmplitude: { value: this.currentParams.breathAmplitude },
      uNoiseAmplitude: { value: this.currentParams.noiseAmplitude },
      uColorMixSpeed: { value: this.currentParams.colorMixSpeed },
      uGlowIntensity: { value: this.currentParams.glowIntensity },
      uAlphaBase: { value: this.currentParams.alphaBase },
      uParticleSize: { value: this.currentParams.particleSize },
      uParticleSides: { value: this.currentParams.particleSides },
      uPrimaryColor: { value: new THREE.Vector3(...Object.values(hexToRgb(this.currentParams.primaryColor))) },
      uSecondaryColor: { value: new THREE.Vector3(...Object.values(hexToRgb(this.currentParams.secondaryColor))) },
      uParticleColorMix: { value: 0 }, // 0 = gradient, 1 = particle color
    }

    // 粒子颜色属性（用于展示模式下显示采样颜色）
    const particleColors = new Float32Array(count * 3)
    geometry.setAttribute('aParticleColor', new THREE.BufferAttribute(particleColors, 3))

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

  // === 主更新循环 ===

  update(time: number, audioIntensity: number = 0) {
    this.uniforms.uTime.value = time
    this.audioIntensity = audioIntensity

    // 1. 参数 lerp 插值
    this.lerpParams()

    // 2. 粒子重建检查
    this.checkRebuild()

    // 3. 同步 uniforms
    this.syncUniforms()

    // 4. 委托给当前状态行为
    if (this.currentState && this.particles) {
      const ctx = this.buildContext(time)
      const modified = this.currentState.update(ctx)

      if (modified) {
        // 状态修改了 positions/normals
        this.particles.geometry.attributes.position.needsUpdate = true
        this.particles.geometry.attributes.normal.needsUpdate = true
        this.lastUpdateReturnedTrue = true
      } else if (this.lastUpdateReturnedTrue) {
        // 状态从修改 positions → 不修改，需要球体恢复
        this.lastUpdateReturnedTrue = false
        this.needsSphereRecovery = true
      }

      // 球体恢复：当状态不处理位置但位置偏离球体时
      if (this.needsSphereRecovery && !modified) {
        this.doSphereRecovery()
      }
    }

    // 5. 整体旋转
    if (this.particles) {
      this.particles.rotation.y = time * this.currentParams.rotationSpeed + this.userRotationY
    }
  }

  // === 参数插值 ===

  private lerpParams() {
    const speed = this.targetParams.transitionSpeed ?? 0.08

    this.currentParams.radius = lerp(this.currentParams.radius, this.targetParams.radius, speed * 1.5)
    this.currentParams.particleSize = lerp(this.currentParams.particleSize, this.targetParams.particleSize, speed * 1.2)
    this.currentParams.animSpeed = lerp(this.currentParams.animSpeed, this.targetParams.animSpeed, speed)
    this.currentParams.breathSpeed = lerp(this.currentParams.breathSpeed, this.targetParams.breathSpeed, speed)
    this.currentParams.breathAmplitude = lerp(this.currentParams.breathAmplitude, this.targetParams.breathAmplitude, speed)
    this.currentParams.noiseAmplitude = lerp(this.currentParams.noiseAmplitude, this.targetParams.noiseAmplitude, speed)
    this.currentParams.rotationSpeed = lerp(this.currentParams.rotationSpeed, this.targetParams.rotationSpeed, speed)
    this.currentParams.colorMixSpeed = lerp(this.currentParams.colorMixSpeed, this.targetParams.colorMixSpeed, speed)
    this.currentParams.glowIntensity = lerp(this.currentParams.glowIntensity, this.targetParams.glowIntensity, speed)
    this.currentParams.alphaBase = lerp(this.currentParams.alphaBase, this.targetParams.alphaBase, speed)

    this.currentParams.primaryColor = this.targetParams.primaryColor
    this.currentParams.secondaryColor = this.targetParams.secondaryColor
  }

  // === 粒子重建 ===

  private checkRebuild() {
    const countDiff = Math.abs(this.currentParams.particleCount - this.targetParams.particleCount)
    const sidesDiff = Math.abs(this.currentParams.particleSides - this.targetParams.particleSides)
    const radiusChanged = Math.abs(this.currentParams.radius - this.targetParams.radius) > 0.01

    if (countDiff > 100 || sidesDiff > 0.5) {
      this.currentParams.particleCount = this.targetParams.particleCount
      this.currentParams.particleSides = this.targetParams.particleSides

      if (this.particles) {
        this.particles.geometry.dispose();
        (this.particles.material as THREE.Material).dispose()
        this.scene.remove(this.particles)
      }
      this.createParticles()
    } else if (radiusChanged && this.particles && this.particleDirections
               && !this.lastUpdateReturnedTrue && !this.needsSphereRecovery) {
      // 半径变化时更新球体位置（仅在状态不处理位置时）
      const posAttr = this.particles.geometry.attributes.position
      const positions = posAttr.array as Float32Array
      const radius = this.currentParams.radius
      const count = this.currentParams.particleCount

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        positions[i3] = radius * this.particleDirections[i3]
        positions[i3 + 1] = radius * this.particleDirections[i3 + 1]
        positions[i3 + 2] = radius * this.particleDirections[i3 + 2]
      }
      posAttr.needsUpdate = true
    }
  }

  // === 球体恢复 ===

  private doSphereRecovery() {
    if (!this.particles || !this.particleDirections) return

    const posAttr = this.particles.geometry.attributes.position
    const positions = posAttr.array as Float32Array
    const radius = this.currentParams.radius
    const count = this.currentParams.particleCount
    const speed = this.targetParams.transitionSpeed ?? 0.08
    let allDone = true

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const tx = radius * this.particleDirections[i3]
      const ty = radius * this.particleDirections[i3 + 1]
      const tz = radius * this.particleDirections[i3 + 2]

      positions[i3] = lerp(positions[i3], tx, speed)
      positions[i3 + 1] = lerp(positions[i3 + 1], ty, speed)
      positions[i3 + 2] = lerp(positions[i3 + 2], tz, speed)

      if (Math.abs(positions[i3] - tx) > 0.01 ||
          Math.abs(positions[i3 + 1] - ty) > 0.01 ||
          Math.abs(positions[i3 + 2] - tz) > 0.01) {
        allDone = false
      }
    }

    posAttr.needsUpdate = true

    if (allDone) {
      this.needsSphereRecovery = false
      logger.log('[FluidParticles] Sphere recovery complete')
    }
  }

  // === Uniform 同步 ===

  private syncUniforms() {
    const p = this.currentParams
    this.uniforms.uAnimSpeed.value = p.animSpeed
    this.uniforms.uBreathSpeed.value = p.breathSpeed
    this.uniforms.uBreathAmplitude.value = p.breathAmplitude
    this.uniforms.uNoiseAmplitude.value = p.noiseAmplitude
    this.uniforms.uColorMixSpeed.value = p.colorMixSpeed
    this.uniforms.uGlowIntensity.value = p.glowIntensity
    this.uniforms.uAlphaBase.value = p.alphaBase
    this.uniforms.uParticleSize.value = p.particleSize
    this.uniforms.uParticleSides.value = p.particleSides

    const primaryRgb = hexToRgb(p.primaryColor)
    const secondaryRgb = hexToRgb(p.secondaryColor)
    this.uniforms.uPrimaryColor.value.set(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    this.uniforms.uSecondaryColor.value.set(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
  }

  // === 上下文构建 ===

  private buildContext(time: number): StateContext {
    const geo = this.particles!.geometry
    return {
      positions: geo.attributes.position.array as Float32Array,
      normals: geo.attributes.normal.array as Float32Array,
      randomness: geo.attributes.aRandomness.array as Float32Array,
      particleDirections: this.particleDirections ?? new Float32Array(0),
      particleCount: this.currentParams.particleCount,
      baseRadius: this.targetParams.radius,
      frequencyData: this.frequencyData,
      audioIntensity: this.audioIntensity,
      showPositions: this.showPositions,
      showColors: this.showColors,
      time,
    }
  }

  // === 公共 API ===

  /**
   * 设置当前状态（切换时调用 onExit/onEnter）
   */
  setState(id: string): void {
    const newState = StateRegistry.get(id)
    if (!newState) {
      logger.log(`[FluidParticles] Unknown state: ${id}`)
      return
    }
    if (newState === this.currentState) return

    logger.log(`[FluidParticles] State change: ${this.currentState?.id ?? 'none'} → ${id}`)

    // 退出旧状态
    if (this.currentState && this.particles) {
      const ctx = this.buildContext(0)
      this.currentState.onExit(ctx)
    }

    this.previousStateId = this.currentState?.id ?? null
    this.currentState = newState
    this.lastUpdateReturnedTrue = false
    this.needsSphereRecovery = false  // 新状态接管，不需要恢复

    // 进入新状态
    if (this.particles) {
      const ctx = this.buildContext(0)
      newState.onEnter(ctx, this.previousStateId)
    }

    // 应用新状态预设参数
    this.targetParams = { ...newState.preset }
  }

  setTargetParams(params: FluidParams) {
    this.targetParams = { ...params }
  }

  updateParams(params: FluidParams) {
    this.targetParams = { ...params }
    this.currentParams = { ...params }
    this.syncUniforms()

    if (this.particles) {
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose()
      this.scene.remove(this.particles)
    }
    this.createParticles()
  }

  updateFrequencyData(data: Uint8Array | null): void {
    this.frequencyData = data
  }

  setShowContent(positions: Float32Array, colors?: Float32Array): void {
    logger.log(`[FluidParticles] setShowContent: ${positions.length / 3} points${colors ? ', with colors' : ''}`)
    this.showPositions = positions
    this.showColors = colors ?? null

    // 更新粒子颜色 buffer 和 uniform
    if (this.particles) {
      const colorAttr = this.particles.geometry.attributes.aParticleColor
      if (colorAttr) {
        const colorArray = colorAttr.array as Float32Array
        if (colors && colors.length >= this.currentParams.particleCount * 3) {
          // 复制颜色到 buffer
          colorArray.set(colors.subarray(0, this.currentParams.particleCount * 3))
          // 启用粒子颜色混合
          this.uniforms.uParticleColorMix.value = 1.0
        } else {
          // 没有颜色数据，清零
          colorArray.fill(0)
          this.uniforms.uParticleColorMix.value = 0.0
        }
        colorAttr.needsUpdate = true
      }
    }

    // 如果已在 show 状态但 positions 到达晚于 setState，重新触发 onEnter
    if (this.currentState?.id === 'show' && this.particles) {
      const ctx = this.buildContext(0)
      this.currentState.onEnter(ctx, null)
    }
  }

  cancelShow(): void {
    logger.log('[FluidParticles] cancelShow')
    this.showPositions = null
    this.showColors = null
    // 恢复渐变颜色
    if (this.uniforms.uParticleColorMix) {
      this.uniforms.uParticleColorMix.value = 0.0
    }
  }

  exitShowMode(): void {
    logger.log('[FluidParticles] exitShowMode')
    // 触发当前状态（show）的 onExit → 进入退出过渡
    if (this.currentState?.id === 'show' && this.particles) {
      const ctx = this.buildContext(0)
      this.currentState.onExit(ctx)
    }
    this.showPositions = null
    this.showColors = null
    // 恢复渐变颜色
    if (this.uniforms.uParticleColorMix) {
      this.uniforms.uParticleColorMix.value = 0.0
    }
  }

  isInShowMode(): boolean {
    return this.currentState?.id === 'show'
  }

  setUserRotation(rotationY: number): void {
    this.userRotationY = rotationY
  }

  getCurrentStateId(): string | null {
    return this.currentState?.id ?? null
  }

  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose()
      this.scene.remove(this.particles)
    }
  }
}
