// src/zed/statePresets.ts
import type { FluidParams } from '../components/ControlPanel'
import type { ZedState } from '../types'

// 统一预设值（所有状态共享）
const UNIFIED_RADIUS = 1.5
const UNIFIED_PARTICLE_SIZE = 15.0
const UNIFIED_PARTICLE_COUNT = 6000

// 状态预设参数配置
export const statePresets: Record<ZedState, FluidParams> = {
  // intro — 初始化状态：粒子分散在全屏范围，缓慢旋转
  intro: {
    particleCount: UNIFIED_PARTICLE_COUNT,
    particleSize: 50.0, // 增大粒子大小，补偿半径增大导致的视觉缩小
    particleSides: 0, // 圆形
    radius: 8.0, // 大半径，粒子分散
    animSpeed: 0.3,
    noiseAmplitude: 0.2,
    breathSpeed: 0.5,
    breathAmplitude: 0.05,
    rotationSpeed: 0.08,
    colorMixSpeed: 0.3,
    glowIntensity: 0.4,
    alphaBase: 0.5,
    primaryColor: '#4ecdc4',
    secondaryColor: '#ff6b6b',
  },

  // idle — 呼吸冥想：平静、内敛、有生命力
  idle: {
    particleCount: UNIFIED_PARTICLE_COUNT,
    particleSize: UNIFIED_PARTICLE_SIZE,
    particleSides: 0, // 圆形
    radius: UNIFIED_RADIUS,
    animSpeed: 0.5,
    noiseAmplitude: 0.3,
    breathSpeed: 0.8,
    breathAmplitude: 0.1,
    rotationSpeed: 0.1,
    colorMixSpeed: 0.3,
    glowIntensity: 0.5,
    alphaBase: 0.6,
    primaryColor: '#4ecdc4',
    secondaryColor: '#ff6b6b',
  },

  // offline — 沉睡冬眠：服务不可用，低功耗等待
  offline: {
    particleCount: UNIFIED_PARTICLE_COUNT,
    particleSize: UNIFIED_PARTICLE_SIZE,
    particleSides: 0, // 圆形
    radius: UNIFIED_RADIUS,
    animSpeed: 2.0,
    noiseAmplitude: 0.05,
    breathSpeed: 0.3,
    breathAmplitude: 0.02,
    rotationSpeed: 0.3,
    colorMixSpeed: 0.1,
    glowIntensity: 0.5,
    alphaBase: 1.0,
    primaryColor: '#2a2a4a',
    secondaryColor: '#1a1a2e',
  },

  // reconnecting — 苏醒启动：从离线恢复，建立连接
  reconnecting: {
    particleCount: UNIFIED_PARTICLE_COUNT,
    particleSize: UNIFIED_PARTICLE_SIZE,
    particleSides: 6, // 六边形，像晶体
    radius: UNIFIED_RADIUS,
    animSpeed: 1.0,
    noiseAmplitude: 0.6,
    breathSpeed: 1.2,
    breathAmplitude: 0.15,
    rotationSpeed: 0.2,
    colorMixSpeed: 0.8,
    glowIntensity: 0.5,
    alphaBase: 0.6,
    primaryColor: '#2a2a4a',
    secondaryColor: '#4ecdc4',
  },

  // listening — 声纹聚焦：专注接收，像耳朵在捕捉声波
  listening: {
    particleCount: UNIFIED_PARTICLE_COUNT,
    particleSize: UNIFIED_PARTICLE_SIZE,
    particleSides: 0, // 圆形，柔和
    radius: UNIFIED_RADIUS,
    animSpeed: 0.8,
    noiseAmplitude: 0.8,
    breathSpeed: 1.5,
    breathAmplitude: 0.2,
    rotationSpeed: 0.05,
    colorMixSpeed: 0.5,
    glowIntensity: 0.6,
    alphaBase: 0.7,
    primaryColor: '#ff6b6b',
    secondaryColor: '#4ecdc4',
  },

  // thinking — 神经网络：高速运算，像在思考和联想
  thinking: {
    particleCount: UNIFIED_PARTICLE_COUNT,
    particleSize: UNIFIED_PARTICLE_SIZE,
    particleSides: 4, // 四边形
    radius: UNIFIED_RADIUS,
    animSpeed: 1.5,
    noiseAmplitude: 1.0,
    breathSpeed: 2.0,
    breathAmplitude: 0.05,
    rotationSpeed: 0.3,
    colorMixSpeed: 2.0,
    glowIntensity: 0.8,
    alphaBase: 0.8,
    primaryColor: '#4ecdc4',
    secondaryColor: '#ff6b6b',
  },

  // speaking — 液态流溢：在输出，像液体在流动表达
  speaking: {
    particleCount: UNIFIED_PARTICLE_COUNT,
    particleSize: UNIFIED_PARTICLE_SIZE,
    particleSides: 0, // 圆形
    radius: UNIFIED_RADIUS,
    animSpeed: 0.6,
    noiseAmplitude: 0.5,
    breathSpeed: 1.0,
    breathAmplitude: 0.15,
    rotationSpeed: 0.08,
    colorMixSpeed: 0.8,
    glowIntensity: 0.7,
    alphaBase: 0.9,
    primaryColor: '#4ecdc4',
    secondaryColor: '#ff6b6b',
  },

  // error — 信号干扰：出错了，像信号受到干扰
  error: {
    particleCount: UNIFIED_PARTICLE_COUNT,
    particleSize: 20, // 单独设置粒子大小
    particleSides: 3, // 三角形
    radius: UNIFIED_RADIUS,
    animSpeed: 1.2,
    noiseAmplitude: 0.85,
    breathSpeed: 0.5,
    breathAmplitude: 0,
    rotationSpeed: 0.5,
    colorMixSpeed: 3.0,
    glowIntensity: 0.9,
    alphaBase: 0.5,
    primaryColor: '#ff4757',
    secondaryColor: '#d50000',
  },
}

// 状态显示信息
export const stateInfo: Record<ZedState, { label: string; color: string }> = {
  intro: { label: '初始化', color: '#888888' },
  idle: { label: '空闲', color: '#4ecdc4' },
  offline: { label: '离线', color: '#2a2a4a' },
  reconnecting: { label: '重连中', color: '#4ecdc4' },
  listening: { label: '倾听中', color: '#ff6b6b' },
  thinking: { label: '思考中', color: '#ffd93d' },
  speaking: { label: '回复中', color: '#4ecdc4' },
  error: { label: '错误', color: '#ff4444' },
}
