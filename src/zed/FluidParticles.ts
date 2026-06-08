// src/zed/FluidParticles.ts

import * as THREE from 'three'
import { vertexShader, fragmentShader } from './shaders'
import type { FluidParams } from '../components/ControlPanel'

export class FluidParticles {
  private scene: THREE.Scene
  private particles: THREE.Points | null = null
  private uniforms: { [key: string]: THREE.IUniform } = {}
  private params: FluidParams

  constructor(scene: THREE.Scene, params: FluidParams) {
    this.scene = scene
    this.params = params
    this.createParticles()
  }

  private createParticles() {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(this.params.particleCount * 3)
    const normals = new Float32Array(this.params.particleCount * 3)
    const scales = new Float32Array(this.params.particleCount)
    const randomness = new Float32Array(this.params.particleCount)

    for (let i = 0; i < this.params.particleCount; i++) {
      const i3 = i * 3

      // Sphere distribution
      const radius = this.params.radius
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
      uAnimSpeed: { value: this.params.animSpeed },
      uBreathSpeed: { value: this.params.breathSpeed },
      uBreathAmplitude: { value: this.params.breathAmplitude },
      uNoiseAmplitude: { value: this.params.noiseAmplitude },
      uColorMixSpeed: { value: this.params.colorMixSpeed },
      uGlowIntensity: { value: this.params.glowIntensity },
      uAlphaBase: { value: this.params.alphaBase },
      uParticleSize: { value: this.params.particleSize },
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

    if (this.particles) {
      this.particles.rotation.y = time * this.params.rotationSpeed
    }
  }

  updateParams(params: FluidParams) {
    const needsRebuild =
      params.particleCount !== this.params.particleCount ||
      params.radius !== this.params.radius

    this.params = params

    // Update shader uniforms
    this.uniforms.uAnimSpeed.value = params.animSpeed
    this.uniforms.uBreathSpeed.value = params.breathSpeed
    this.uniforms.uBreathAmplitude.value = params.breathAmplitude
    this.uniforms.uNoiseAmplitude.value = params.noiseAmplitude
    this.uniforms.uColorMixSpeed.value = params.colorMixSpeed
    this.uniforms.uGlowIntensity.value = params.glowIntensity
    this.uniforms.uAlphaBase.value = params.alphaBase
    this.uniforms.uParticleSize.value = params.particleSize

    // Rebuild particles if count or radius changed
    if (needsRebuild) {
      if (this.particles) {
        this.particles.geometry.dispose()
        ;(this.particles.material as THREE.Material).dispose()
        this.scene.remove(this.particles)
      }
      this.createParticles()
    }
  }

  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose()
      ;(this.particles.material as THREE.Material).dispose()
      this.scene.remove(this.particles)
    }
  }
}
