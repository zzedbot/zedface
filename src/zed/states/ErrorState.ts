// src/zed/states/ErrorState.ts

import { StateRegistry } from './StateRegistry'
import type { StateBehavior, StateContext } from './StateBehavior'

const error: StateBehavior = {
  id: 'error',
  label: '错误',
  color: '#ff4757',

  preset: {
    particleCount: 6000,
    particleSize: 20,
    particleSides: 3,
    radius: 1.5,
    animSpeed: 1.2,
    noiseAmplitude: 0.85,
    breathSpeed: 0.5,
    breathAmplitude: 0,
    rotationSpeed: 0.5,
    transitionSpeed: 0.12,
    colorMixSpeed: 3.0,
    glowIntensity: 0.9,
    alphaBase: 0.5,
    primaryColor: '#ff4757',
    secondaryColor: '#d50000',
  },

  onEnter() {},
  onExit() {},

  update(_ctx: StateContext): boolean {
    return false
  },
}

StateRegistry.register(error)
