// src/zed/FluidParticles.ts

import * as THREE from 'three'
import { vertexShader, fragmentShader } from './shaders'

export class FluidParticles {
  private scene: THREE.Scene
  private particles: THREE.Points | null = null
  private uniforms: { [key: string]: THREE.IUniform } = {}
  private particleCount = 8000

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.createParticles()
  }

  private createParticles() {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(this.particleCount * 3)
    const normals = new Float32Array(this.particleCount * 3)
    const scales = new Float32Array(this.particleCount)
    const randomness = new Float32Array(this.particleCount)

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3

      // Sphere distribution
      const radius = 2
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
      this.particles.rotation.y = time * 0.05
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
