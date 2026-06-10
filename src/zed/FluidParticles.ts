// src/zed/FluidParticles.ts

import * as THREE from 'three'
import { vertexShader, fragmentShader } from './shaders'
import type { FluidParams } from '../components/ControlPanel'

// 线性插值函数
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

  // 插值速度（每帧接近目标的比例）
  private lerpSpeed = 0.03

  // 粒子方向向量（用于半径变化时的平滑过渡）
  private particleDirections: Float32Array | null = null

  // 展示模式相关
  private showTargetPositions: Float32Array | null = null
  private isShowMode: boolean = false
  private showTransitionProgress: number = 0
  private isExitingShowMode: boolean = false // 标记是否正在退出展示模式
  private sphereTargetPositions: Float32Array | null = null // 退出展示模式时的球体目标位置

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

    // 插值当前参数向目标参数靠近
    const t = this.lerpSpeed

    this.currentParams.animSpeed = lerp(this.currentParams.animSpeed, this.targetParams.animSpeed, t)
    this.currentParams.breathSpeed = lerp(this.currentParams.breathSpeed, this.targetParams.breathSpeed, t)
    this.currentParams.breathAmplitude = lerp(this.currentParams.breathAmplitude, this.targetParams.breathAmplitude, t)
    this.currentParams.noiseAmplitude = lerp(this.currentParams.noiseAmplitude, this.targetParams.noiseAmplitude, t)
    this.currentParams.rotationSpeed = lerp(this.currentParams.rotationSpeed, this.targetParams.rotationSpeed, t)
    this.currentParams.colorMixSpeed = lerp(this.currentParams.colorMixSpeed, this.targetParams.colorMixSpeed, t)
    this.currentParams.glowIntensity = lerp(this.currentParams.glowIntensity, this.targetParams.glowIntensity, t)
    this.currentParams.alphaBase = lerp(this.currentParams.alphaBase, this.targetParams.alphaBase, t)
    this.currentParams.particleSize = lerp(this.currentParams.particleSize, this.targetParams.particleSize, t)

    // 半径也进行插值
    const radiusChanged = Math.abs(this.currentParams.radius - this.targetParams.radius) > 0.01
    this.currentParams.radius = lerp(this.currentParams.radius, this.targetParams.radius, t)

    // 颜色参数直接更新（不插值）
    this.currentParams.primaryColor = this.targetParams.primaryColor
    this.currentParams.secondaryColor = this.targetParams.secondaryColor

    // 对于需要重建的属性（粒子数量、形状），使用阈值判断是否更新
    const countDiff = Math.abs(this.currentParams.particleCount - this.targetParams.particleCount)
    const sidesDiff = Math.abs(this.currentParams.particleSides - this.targetParams.particleSides)

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

    // 展示模式处理
    if (this.isShowMode && this.showTargetPositions && this.particles) {
      // 逐渐增加过渡进度
      this.showTransitionProgress = Math.min(1, this.showTransitionProgress + 0.02)

      const posAttr = this.particles.geometry.attributes.position
      const positions = posAttr.array as Float32Array

      // 粒子向目标位置过渡
      const transitionSpeed = 0.05
      for (let i = 0; i < this.currentParams.particleCount; i++) {
        const i3 = i * 3
        const targetIndex = (i % (this.showTargetPositions.length / 3)) * 3

        positions[i3] = lerp(positions[i3], this.showTargetPositions[targetIndex], transitionSpeed)
        positions[i3 + 1] = lerp(positions[i3 + 1], this.showTargetPositions[targetIndex + 1], transitionSpeed)
        positions[i3 + 2] = lerp(positions[i3 + 2], this.showTargetPositions[targetIndex + 2], transitionSpeed)
      }
      posAttr.needsUpdate = true

      // 在展示模式下减少旋转
      this.particles.rotation.y = time * this.currentParams.rotationSpeed * 0.1
    } else if (this.particles) {
      // 非展示模式：正常球体行为
      // 如果刚从展示模式退出，平滑过渡到球体位置
      if (this.isExitingShowMode) {
        // 首次退出时，计算球体目标位置
        if (!this.sphereTargetPositions) {
          console.log('[FluidParticles] Calculating sphere target positions')
          this.sphereTargetPositions = new Float32Array(this.currentParams.particleCount * 3)
          const radius = this.currentParams.radius

          for (let i = 0; i < this.currentParams.particleCount; i++) {
            const i3 = i * 3
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(Math.random() * 2 - 1)

            this.sphereTargetPositions[i3] = radius * Math.sin(phi) * Math.cos(theta)
            this.sphereTargetPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            this.sphereTargetPositions[i3 + 2] = radius * Math.cos(phi)
          }
        }

        // 粒子向球体目标位置过渡
        const posAttr = this.particles.geometry.attributes.position
        const positions = posAttr.array as Float32Array
        const transitionSpeed = 0.05
        let allTransitioned = true

        for (let i = 0; i < this.currentParams.particleCount; i++) {
          const i3 = i * 3

          positions[i3] = lerp(positions[i3], this.sphereTargetPositions[i3], transitionSpeed)
          positions[i3 + 1] = lerp(positions[i3 + 1], this.sphereTargetPositions[i3 + 1], transitionSpeed)
          positions[i3 + 2] = lerp(positions[i3 + 2], this.sphereTargetPositions[i3 + 2], transitionSpeed)

          // 检查是否所有粒子都已过渡完成
          const dx = positions[i3] - this.sphereTargetPositions[i3]
          const dy = positions[i3 + 1] - this.sphereTargetPositions[i3 + 1]
          const dz = positions[i3 + 2] - this.sphereTargetPositions[i3 + 2]
          if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01 || Math.abs(dz) > 0.01) {
            allTransitioned = false
          }
        }
        posAttr.needsUpdate = true

        // 过渡完成后清理
        if (allTransitioned) {
          console.log('[FluidParticles] Transition to sphere complete')
          this.isExitingShowMode = false
          this.sphereTargetPositions = null
        }
      }

      this.particles.rotation.y = time * this.currentParams.rotationSpeed
    }
  }

  // 设置目标参数（触发平滑过渡）
  setTargetParams(params: FluidParams) {
    console.log('[FluidParticles] setTargetParams called:', params.animSpeed, params.noiseAmplitude)
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
   * 设置展示内容（进入展示模式）
   */
  setShowContent(positions: Float32Array): void {
    console.log('[FluidParticles] Entering show mode with', positions.length / 3, 'points')

    this.showTargetPositions = positions
    this.isShowMode = true
    this.showTransitionProgress = 0
    this.isExitingShowMode = false
  }

  /**
   * 退出展示模式
   */
  exitShowMode(): void {
    console.log('[FluidParticles] Exiting show mode')
    this.isShowMode = false
    this.showTransitionProgress = 0
    this.isExitingShowMode = true
  }

  /**
   * 检查是否在展示模式
   */
  isInShowMode(): boolean {
    return this.isShowMode
  }

  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose()
      ;(this.particles.material as THREE.Material).dispose()
      this.scene.remove(this.particles)
    }
  }
}
