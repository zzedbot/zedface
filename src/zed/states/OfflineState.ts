// src/zed/states/OfflineState.ts

import { StateRegistry } from './StateRegistry'
import type { StateBehavior, StateContext } from './StateBehavior'

const offline: StateBehavior = {
  id: 'offline',
  label: '离线',
  color: '#2a2a4a',

  preset: {
    particleCount: 6000,
    particleSize: 15.0,
    particleSides: 0,
    radius: 1.5,
    animSpeed: 0.1,
    noiseAmplitude: 0.05,
    breathSpeed: 0.3,
    breathAmplitude: 0.02,
    rotationSpeed: 0.3,
    transitionSpeed: 0.08,
    colorMixSpeed: 0.1,
    glowIntensity: 0.5,
    alphaBase: 1.0,
    primaryColor: '#2a2a4a',
    secondaryColor: '#1a1a2e',
  },

  onEnter() {},
  onExit() {},

  update(_ctx: StateContext): boolean {
    return false
  },
}

StateRegistry.register(offline)
