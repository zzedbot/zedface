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

    for (let i = 0; i < this.currentParams.particleCount; i++) {
      const i3 = i * 3

      // Sphere distribution
      const radius = this.currentParams.radius
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)

      // Normals (pointing outward)
      normals[i3] = positions[i3] / radius
      normals[i3 + 1] = positions[i3 + 1] / radius
      normals[i3 + 2] = positions[i3 + 2] / radius

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

    // 颜色参数直接更新（不插值）
    this.currentParams.primaryColor = this.targetParams.primaryColor
    this.currentParams.secondaryColor = this.targetParams.secondaryColor

    // 对于需要重建的属性，使用阈值判断是否更新
    const radiusDiff = Math.abs(this.currentParams.radius - this.targetParams.radius)
    const countDiff = Math.abs(this.currentParams.particleCount - this.targetParams.particleCount)
    const sidesDiff = Math.abs(this.currentParams.particleSides - this.targetParams.particleSides)

    // 如果差异足够大，立即重建
    if (radiusDiff > 0.1 || countDiff > 100 || sidesDiff > 0.5) {
      this.currentParams.radius = this.targetParams.radius
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

    if (this.particles) {
      this.particles.rotation.y = time * this.currentParams.rotationSpeed
    }
  }

  // 设置目标参数（触发平滑过渡）
  setTargetParams(params: FluidParams) {
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

  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose()
      ;(this.particles.material as THREE.Material).dispose()
      this.scene.remove(this.particles)
    }
  }
}
