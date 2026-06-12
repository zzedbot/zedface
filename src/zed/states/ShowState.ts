// src/zed/states/ShowState.ts
// 展示模式：粒子形成文字/图形
// 生命周期：entering(等参数收敛) → active(位置过渡) → exiting(回球体)

import { StateRegistry } from './StateRegistry'
import type { StateBehavior, StateContext } from './StateBehavior'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

type ShowPhase = 'idle' | 'entering' | 'active' | 'exiting'

// 模块级状态（每个时刻只有一个 show 实例）
let phase: ShowPhase = 'idle'
let pendingPositions: Float32Array | null = null
let targetPositions: Float32Array | null = null
let sphereTargetPositions: Float32Array | null = null
let showPresetRadius = 3.0  // show preset 的 radius，用于收敛检测

const show: StateBehavior = {
  id: 'show',
  label: '展示',
  color: '#4ecdc4',

  preset: {
    particleCount: 6000,
    particleSize: 8.0,
    particleSides: 0,
    radius: 3.0,
    animSpeed: 0.1,
    noiseAmplitude: 0.05,
    breathSpeed: 0.3,
    breathAmplitude: 0.02,
    rotationSpeed: 0,
    transitionSpeed: 0.1,
    colorMixSpeed: 0.2,
    glowIntensity: 0.6,
    alphaBase: 0.8,
    primaryColor: '#4ecdc4',
    secondaryColor: '#ffffff',
  },

  onEnter(ctx: StateContext, _prev: string | null) {
    if (ctx.showPositions && ctx.showPositions.length > 0) {
      pendingPositions = ctx.showPositions
      phase = 'entering'
      targetPositions = null
      sphereTargetPositions = null
      showPresetRadius = this.preset.radius
    }
  },

  onExit(_ctx: StateContext) {
    if (phase === 'active' || phase === 'entering') {
      phase = 'exiting'
      sphereTargetPositions = null
    }
    pendingPositions = null
    targetPositions = null
  },

  update(ctx: StateContext): boolean {
    if (phase === 'idle') return false

    const { positions, particleCount, baseRadius } = ctx

    // === entering: 等待参数 lerp 收敛到 show preset ===
    if (phase === 'entering' && pendingPositions) {
      // 检测 baseRadius 是否已接近 show preset 的 radius
      const radiusConverged = Math.abs(baseRadius - showPresetRadius) < 0.1
      if (radiusConverged) {
        targetPositions = pendingPositions
        pendingPositions = null
        phase = 'active'
      }
      // 收敛前不做位置修改，让参数 lerp 自然推进
      return false
    }

    // === active: 粒子向展示位置过渡 ===
    if (phase === 'active' && targetPositions) {
      const transitionSpeed = 0.08
      const targetLen = targetPositions.length / 3

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        const ti = (i % targetLen) * 3
        positions[i3] = lerp(positions[i3], targetPositions[ti], transitionSpeed)
        positions[i3 + 1] = lerp(positions[i3 + 1], targetPositions[ti + 1], transitionSpeed)
        positions[i3 + 2] = lerp(positions[i3 + 2], targetPositions[ti + 2], transitionSpeed)
      }
      return true
    }

    // === exiting: 用原始粒子方向生成球体目标，确保与 doSphereRecovery 一致 ===
    if (phase === 'exiting') {
      if (!sphereTargetPositions) {
        sphereTargetPositions = new Float32Array(particleCount * 3)
        const radius = baseRadius
        const dirs = ctx.particleDirections
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3
          if (dirs.length > i3 + 2) {
            // 使用原始方向（与粒子初始分布一致）
            sphereTargetPositions[i3] = radius * dirs[i3]
            sphereTargetPositions[i3 + 1] = radius * dirs[i3 + 1]
            sphereTargetPositions[i3 + 2] = radius * dirs[i3 + 2]
          } else {
            // fallback: 随机方向
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(Math.random() * 2 - 1)
            sphereTargetPositions[i3] = radius * Math.sin(phi) * Math.cos(theta)
            sphereTargetPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            sphereTargetPositions[i3 + 2] = radius * Math.cos(phi)
          }
        }
      }

      const transitionSpeed = 0.08
      let allDone = true

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3] = lerp(positions[i3], sphereTargetPositions[i3], transitionSpeed)
        positions[i3 + 1] = lerp(positions[i3 + 1], sphereTargetPositions[i3 + 1], transitionSpeed)
        positions[i3 + 2] = lerp(positions[i3 + 2], sphereTargetPositions[i3 + 2], transitionSpeed)

        const dx = positions[i3] - sphereTargetPositions[i3]
        const dy = positions[i3 + 1] - sphereTargetPositions[i3 + 1]
        const dz = positions[i3 + 2] - sphereTargetPositions[i3 + 2]
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01 || Math.abs(dz) > 0.01) {
          allDone = false
        }
      }

      if (allDone) {
        phase = 'idle'
        sphereTargetPositions = null
        targetPositions = null
      }

      return true
    }

    return false
  },
}

StateRegistry.register(show)
