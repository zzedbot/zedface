// src/zed/statePresets.ts
import type { FluidParams } from '../components/ControlPanel'
import type { ZedState } from '../types'

// 状态预设参数配置
export const statePresets: Record<ZedState, FluidParams> = {
  // idle — 呼吸冥想：平静、内敛、有生命力
  idle: {
    particleCount: 12000,
    particleSize: 8.0,
    particleSides: 0, // 圆形
    radius: 2.5,
    animSpeed: 0.5,
    noiseAmplitude: 0.3,
    breathSpeed: 0.8,
    breathAmplitude: 0.1,
    rotationSpeed: 0.1,
    colorMixSpeed: 0.3,
    glowIntensity: 0.5,
    alphaBase: 0.6,
  },

  // offline — 沉睡冬眠：服务不可用，低功耗等待
  offline: {
    particleCount: 12000,
    particleSize: 3.0, // 粒子小，收敛
    particleSides: 0, // 圆形
    radius: 1.2, // 半径小，极度收敛
    animSpeed: 0.1, // 几乎不动
    noiseAmplitude: 0.05,
    breathSpeed: 0.3,
    breathAmplitude: 0.02, // 极微弱呼吸
    rotationSpeed: 0.01,
    colorMixSpeed: 0.1,
    glowIntensity: 0.1, // 无辉光
    alphaBase: 0.2, // 暗淡
  },

  // reconnecting — 苏醒启动：从离线恢复，建立连接
  reconnecting: {
    particleCount: 12000,
    particleSize: 5.0, // 从小变大
    particleSides: 6, // 六边形，像晶体
    radius: 2.8, // 向外扩散
    animSpeed: 1.0, // 加速
    noiseAmplitude: 0.6,
    breathSpeed: 1.2,
    breathAmplitude: 0.15,
    rotationSpeed: 0.2, // 旋转加快
    colorMixSpeed: 0.8,
    glowIntensity: 0.5, // 逐渐变亮
    alphaBase: 0.6,
  },

  // listening — 声纹聚焦：专注接收，像耳朵在捕捉声波
  listening: {
    particleCount: 12000,
    particleSize: 6.0,
    particleSides: 0, // 圆形，柔和
    radius: 2.0, // 向中心聚拢
    animSpeed: 0.8,
    noiseAmplitude: 0.8, // 跟随声波跳动
    breathSpeed: 1.5,
    breathAmplitude: 0.2,
    rotationSpeed: 0.05,
    colorMixSpeed: 0.5,
    glowIntensity: 0.6,
    alphaBase: 0.7,
  },

  // thinking — 神经网络：高速运算，像在思考和联想
  thinking: {
    particleCount: 12000,
    particleSize: 4.0, // 小三角形
    particleSides: 3, // 三角形，棱角感
    radius: 3.0, // 分散扩散
    animSpeed: 1.5, // 快速
    noiseAmplitude: 1.0, // 大幅度噪声
    breathSpeed: 2.0,
    breathAmplitude: 0.05, // 微弱呼吸，主要靠噪声
    rotationSpeed: 0.3, // 旋转加快
    colorMixSpeed: 2.0, // 快速颜色交替
    glowIntensity: 0.8,
    alphaBase: 0.8,
  },

  // speaking — 液态流溢：在输出，像液体在流动表达
  speaking: {
    particleCount: 12000,
    particleSize: 10.0, // 大圆形，柔和融合
    particleSides: 0, // 圆形
    radius: 2.5,
    animSpeed: 0.6,
    noiseAmplitude: 0.5, // 跟随 TTS 波形
    breathSpeed: 1.0,
    breathAmplitude: 0.15,
    rotationSpeed: 0.08,
    colorMixSpeed: 0.8, // 渐变流光
    glowIntensity: 0.7,
    alphaBase: 0.9,
  },

  // error — 信号干扰：出错了，像信号受到干扰
  error: {
    particleCount: 12000,
    particleSize: 3.0, // 小三角形，尖锐
    particleSides: 3, // 三角形
    radius: 2.8, // 向外飞散
    animSpeed: 2.0, // 快速抖动
    noiseAmplitude: 1.5, // 大幅度噪声
    breathSpeed: 3.0,
    breathAmplitude: 0.4,
    rotationSpeed: 0.5, // 快速旋转
    colorMixSpeed: 3.0, // 快速闪烁
    glowIntensity: 0.9,
    alphaBase: 0.5,
  },
}

// 状态显示信息
export const stateInfo: Record<ZedState, { label: string; color: string }> = {
  idle: { label: '空闲', color: '#4ecdc4' },
  offline: { label: '离线', color: '#2a2a4a' },
  reconnecting: { label: '重连中', color: '#4ecdc4' },
  listening: { label: '倾听中', color: '#ff6b6b' },
  thinking: { label: '思考中', color: '#ffd93d' },
  speaking: { label: '回复中', color: '#4ecdc4' },
  error: { label: '错误', color: '#ff4444' },
}
