// src/zed/states/ThinkingState.ts

import { StateRegistry } from './StateRegistry'
import type { StateBehavior, StateContext } from './StateBehavior'

const thinking: StateBehavior = {
  id: 'thinking',
  label: '思考中',
  color: '#4ecdc4',

  preset: {
    particleCount: 6000,
    particleSize: 15.0,
    particleSides: 4,
    radius: 1.5,
    animSpeed: 1.5,
    noiseAmplitude: 1.0,
    breathSpeed: 2.0,
    breathAmplitude: 0.05,
    rotationSpeed: 0.3,
    transitionSpeed: 0.1,
    colorMixSpeed: 2.0,
    glowIntensity: 0.8,
    alphaBase: 0.8,
    primaryColor: '#4ecdc4',
    secondaryColor: '#ff6b6b',
  },

  onEnter() {},
  onExit() {},

  update(_ctx: StateContext): boolean {
    return false
  },
}

StateRegistry.register(thinking)
