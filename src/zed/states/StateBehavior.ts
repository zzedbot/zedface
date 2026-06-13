// src/zed/states/StateBehavior.ts

import type { FluidParams } from '../../types'

/**
 * StateBehavior 的运行时上下文
 * 由 FluidParticles 每帧构建，状态通过它访问粒子系统和外部数据
 */
export interface StateContext {
  // 粒子系统
  readonly positions: Float32Array
  readonly normals: Float32Array
  readonly randomness: Float32Array
  readonly particleDirections: Float32Array  // 原始球体方向向量（单位向量）
  readonly particleCount: number
  readonly baseRadius: number        // 当前 targetParams.radius

  // 外部数据
  readonly frequencyData: Uint8Array | null
  readonly audioIntensity: number
  readonly showPositions: Float32Array | null
  readonly showColors: Float32Array | null    // 展示模式下的粒子颜色 (RGB)

  // 时间
  readonly time: number
}

/**
 * 状态行为接口
 * 每个状态实现此接口，封装自己的视觉行为
 */
export interface StateBehavior {
  readonly id: string
  readonly label: string
  readonly color: string             // 状态指示颜色
  readonly preset: FluidParams       // 该状态的参数预设

  /**
   * 状态激活时调用
   */
  onEnter(ctx: StateContext, prev: string | null): void

  /**
   * 状态退出时调用
   */
  onExit(ctx: StateContext): void

  /**
   * 每帧更新
   * @returns true 表示修改了 positions/normals（需上传 GPU）
   */
  update(ctx: StateContext): boolean
}
