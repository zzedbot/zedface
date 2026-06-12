// src/zed/states/index.ts
// 导入即注册 — 每个 State 文件在模块顶层调用 StateRegistry.register()

import './IdleState'
import './IntroState'
import './ListeningState'
import './ThinkingState'
import './SpeakingState'
import './OfflineState'
import './ReconnectingState'
import './ErrorState'
import './ShowState'

export { StateRegistry } from './StateRegistry'
export type { StateBehavior, StateContext } from './StateBehavior'
