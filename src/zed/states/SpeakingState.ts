// src/zed/states/SpeakingState.ts

import { StateRegistry } from './StateRegistry'
import type { StateBehavior, StateContext } from './StateBehavior'

const speaking: StateBehavior = {
  id: 'speaking',
  label: '回复中',
  color: '#4ecdc4',

  preset: {
    particleCount: 6000,
    particleSize: 15.0,
    particleSides: 0,
    radius: 1.5,
    animSpeed: 0.6,
    noiseAmplitude: 0.5,
    breathSpeed: 1.0,
    breathAmplitude: 0.15,
    rotationSpeed: 0.08,
    transitionSpeed: 0.08,
    colorMixSpeed: 0.8,
    glowIntensity: 0.7,
    alphaBase: 0.9,
    primaryColor: '#4ecdc4',
    secondaryColor: '#ff6b6b',
  },

  onEnter() {},
  onExit() {},

  update(_ctx: StateContext): boolean {
    return false
  },
}

StateRegistry.register(speaking)
