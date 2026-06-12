// src/zed/states/StateRegistry.ts

import type { StateBehavior } from './StateBehavior'

class StateRegistryClass {
  private states = new Map<string, StateBehavior>()

  register(behavior: StateBehavior): void {
    if (this.states.has(behavior.id)) {
      console.warn(`[StateRegistry] Overwriting state: ${behavior.id}`)
    }
    this.states.set(behavior.id, behavior)
  }

  get(id: string): StateBehavior | undefined {
    return this.states.get(id)
  }

  getAll(): Map<string, StateBehavior> {
    return this.states
  }

  getIds(): string[] {
    return Array.from(this.states.keys())
  }

  /**
   * 获取所有状态的 label/color 信息（控制面板用）
   */
  getInfoList(): { id: string; label: string; color: string }[] {
    return Array.from(this.states.values()).map(s => ({
      id: s.id,
      label: s.label,
      color: s.color,
    }))
  }
}

export const StateRegistry = new StateRegistryClass()
