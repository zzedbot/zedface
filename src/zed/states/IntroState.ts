// src/zed/states/IntroState.ts

import { StateRegistry } from './StateRegistry'
import type { StateBehavior, StateContext } from './StateBehavior'

const intro: StateBehavior = {
  id: 'intro',
  label: '初始化',
  color: '#4ecdc4',

  preset: {
    particleCount: 6000,
    particleSize: 50.0,
    particleSides: 0,
    radius: 8.0,
    animSpeed: 0.3,
    noiseAmplitude: 0.2,
    breathSpeed: 0.5,
    breathAmplitude: 0.05,
    rotationSpeed: 0.08,
    transitionSpeed: 0.12,
    colorMixSpeed: 0.3,
    glowIntensity: 0.4,
    alphaBase: 0.5,
    primaryColor: '#4ecdc4',
    secondaryColor: '#ff6b6b',
  },

  onEnter() {},
  onExit() {},

  update(_ctx: StateContext): boolean {
    return false
  },
}

StateRegistry.register(intro)
