// src/zed/states/ReconnectingState.ts

import { StateRegistry } from './StateRegistry'
import type { StateBehavior, StateContext } from './StateBehavior'

const reconnecting: StateBehavior = {
  id: 'reconnecting',
  label: '重连中',
  color: '#4ecdc4',

  preset: {
    particleCount: 6000,
    particleSize: 15.0,
    particleSides: 6,
    radius: 1.5,
    animSpeed: 1.0,
    noiseAmplitude: 0.6,
    breathSpeed: 1.2,
    breathAmplitude: 0.15,
    rotationSpeed: 0.2,
    transitionSpeed: 0.1,
    colorMixSpeed: 0.8,
    glowIntensity: 0.5,
    alphaBase: 0.6,
    primaryColor: '#2a2a4a',
    secondaryColor: '#4ecdc4',
  },

  onEnter() {},
  onExit() {},

  update(_ctx: StateContext): boolean {
    return false
  },
}

StateRegistry.register(reconnecting)
