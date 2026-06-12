// src/zed/states/IdleState.ts

import { StateRegistry } from './StateRegistry'
import type { StateBehavior, StateContext } from './StateBehavior'

const idle: StateBehavior = {
  id: 'idle',
  label: '空闲',
  color: '#4ecdc4',

  preset: {
    particleCount: 6000,
    particleSize: 15.0,
    particleSides: 0,
    radius: 1.5,
    animSpeed: 0.5,
    noiseAmplitude: 0.3,
    breathSpeed: 0.8,
    breathAmplitude: 0.1,
    rotationSpeed: 0.1,
    transitionSpeed: 0.08,
    colorMixSpeed: 0.3,
    glowIntensity: 0.5,
    alphaBase: 0.6,
    primaryColor: '#4ecdc4',
    secondaryColor: '#ff6b6b',
  },

  onEnter() {},
  onExit() {},

  update(_ctx: StateContext): boolean {
    return false // 使用默认球体行为
  },
}

StateRegistry.register(idle)
