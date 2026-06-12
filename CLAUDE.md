# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Zed** — 赛博朋克风格的多模态 AI 交互 Web 界面。以语音交互为主，视觉优先，Zed 是一个有形象、有性格的 AI 角色。

核心特性：
- **流体粒子系统**：使用 Three.js 实现的流体粒子动画，支持多种状态切换和展示模式
- **状态管理系统**：支持 intro、idle、offline、reconnecting、listening、thinking、speaking、error、show 等状态
- **展示功能**：支持将文字、Emoji、图片、图形展示为粒子形态
- **WebSocket 控制**：支持通过 WebSocket 远程控制状态和参数

## Tech Stack

- **前端框架**: React 18+ (函数组件 + Hooks)
- **构建工具**: Vite
- **3D 动画**: Three.js (流体粒子效果)
- **AI 后端**: OpenClaw — `https://zedbot.kingdee.space`
  - Agent session: `agent:main:dashboard:04f68817-c66c-4baf-a85d-474521783a71`
- **语音识别 (STT)**: 本地部署 Whisper
- **语音合成 (TTS)**: 本地部署 Kokoro
- **远程控制**: WebSocket (ws://localhost:3001)

## Architecture

```
src/
├── components/           # UI 组件
│   ├── Header.tsx               # 顶部状态栏
│   ├── SubtitleDisplay.tsx      # 字幕式对话展示
│   ├── ControlBar.tsx           # 底部控制栏（麦克风、文字输入、历史）
│   ├── ControlPanel.tsx         # 流体参数控制面板
│   ├── HistoryPanel.tsx         # 历史对话面板
│   ├── TextInput.tsx            # 文字输入框
│   ├── LogDisplay.tsx           # 调试日志显示组件
│   └── types.ts                 # 组件类型定义
├── zed/                  # Three.js 流体粒子形象模块
│   ├── ZedAvatar.tsx            # 3D 头像组件（Three.js 容器）
│   ├── FluidParticles.ts      # 流体粒子系统核心类（参数 lerp + 状态委托）
│   ├── shaders.ts             # GLSL 着色器（顶点/片元）
│   └── states/                # 可插拔状态系统
│       ├── StateBehavior.ts   # 状态行为接口
│       ├── StateRegistry.ts   # 状态注册表（单例）
│       ├── index.ts           # 注册入口
│       ├── IdleState.ts       # 空闲 — 普通球体（shader 驱动）
│       ├── IntroState.ts      # 初始化 — 大半径分散
│       ├── ListeningState.ts  # 倾听 — 3D 海胆球频谱
│       ├── ThinkingState.ts   # 思考 — 高速噪点
│       ├── SpeakingState.ts   # 回复 — 液态流溢
│       ├── OfflineState.ts    # 离线 — 暗色低动
│       ├── ReconnectingState.ts # 重连 — 六边形晶体
│       ├── ErrorState.ts      # 错误 — 三角干扰
│       └── ShowState.ts       # 展示 — 文字/图形粒子形态
├── show/                 # 展示功能模块
│   └── ShowManager.ts         # 展示管理器（文字/Emoji/图片/图形）
├── voice/                # 语音处理模块
│   ├── audioManager.ts        # AudioContext 共享管理器（避免多实例）
│   ├── WaveformDisplay.tsx    # 声波波形可视化
│   ├── useAudioAnalyser.ts    # 实时频域数据 Hook
│   ├── useVoiceRecorder.ts    # 录音 Hook
│   ├── useWhisper.ts          # Whisper STT Hook
│   ├── useKokoro.ts           # Kokoro TTS Hook
│   └── useVoiceWake.ts        # 语音唤醒 Hook
├── api/                  # API 对接
│   └── openclaw.ts            # OpenClaw API 客户端
├── hooks/                # 自定义 React Hooks
│   ├── useChat.ts             # 对话状态管理
│   └── useControlSocket.ts    # WebSocket 控制 Hook
├── utils/                # 工具类
│   ├── CanvasSampler.ts       # Canvas 采样器（文字/图形转粒子位置）
│   └── Logger.ts              # 日志管理器
├── types/                # 类型定义
│   └── index.ts               # 全局类型定义
├── styles/               # 样式
│   ├── global.css             # 全局样式
│   └── theme.ts               # 主题变量
├── App.tsx               # 主应用组件
├── main.tsx              # 入口文件
└── vite-env.d.ts         # Vite 类型声明
```

## Core Modules

### FluidParticles (src/zed/FluidParticles.ts)

流体粒子系统核心类，负责：
- **粒子创建和销毁**：根据参数创建粒子几何体和材质
- **参数插值**：使用 lerp 实现参数平滑过渡
- **状态委托**：通过 StateBehavior 接口将每帧位置更新委托给当前状态
- **球体恢复**：当自定义位置状态切换到默认状态时，自动平滑恢复球体
- **外部数据**：管理 frequencyData、showPositions 等，通过 StateContext 暴露给状态

关键方法：
- `update(time, audioIntensity)`：每帧更新（参数 lerp → 重建检查 → uniform 同步 → 状态委托 → 旋转）
- `setState(id)`：切换状态行为（调用 onExit/onEnter）
- `setTargetParams(params)`：设置目标参数（触发平滑过渡）
- `updateParams(params)`：立即设置参数（无过渡，用于手动调整）

### 可插拔状态系统 (src/zed/states/)

每个状态封装为独立文件，实现 `StateBehavior` 接口：
- `preset`：该状态的参数预设
- `onEnter(ctx, prev)`：状态激活时调用
- `onExit(ctx)`：状态退出时调用
- `update(ctx): boolean`：每帧更新，返回 true 表示修改了 positions

**新增状态只需**：
1. 在 `src/zed/states/` 创建 `XxxState.ts`
2. 实现 `StateBehavior` 接口
3. 在文件末尾调用 `StateRegistry.register(behavior)`
4. 在 `src/zed/states/index.ts` 添加 `import './XxxState'`

`StateContext` 提供：positions、normals、randomness、particleCount、baseRadius、frequencyData、audioIntensity、showPositions、time

### ShowManager (src/show/ShowManager.ts)

展示管理器，负责将文字/Emoji/图片/图形转换为粒子位置：
- `showText(text, options)`：展示文字
- `showEmoji(emoji, options)`：展示 Emoji
- `showImage(source, options)`：展示图片（支持 URL 和 Base64）
- `showShape(shape, options)`：展示预定义图形（heart/star/circle/triangle/square）
- `cancelShow()`：取消展示
- `exitShow()`：退出展示模式

### CanvasSampler (src/utils/CanvasSampler.ts)

Canvas 采样器，负责将 2D 内容采样为 3D 粒子位置：
- 使用 Canvas 2D API 绘制文字/图形
- 采样非透明像素点
- 将 2D 坐标转换为 3D 空间坐标
- 支持自动换行和缩放（基于黄金比例 0.618）

关键方法：
- `sampleText(text, options)`：采样文字，支持自动换行
- `sampleEmoji(emoji, options)`：采样 Emoji
- `sampleImage(source, options)`：采样图片（异步）
- `sampleShape(shape, options)`：采样预定义图形
- `samplePixels(maxPoints)`：核心采样方法
- `to3DPositions(points, width, height)`：2D 转 3D 坐标

### State Presets (src/zed/statePresets.ts)

状态预设参数配置，定义了 9 个状态的参数：

| 状态 | 描述 | 特点 |
|------|------|------|
| intro | 初始化 | 粒子分散，大半径(8.0)，大粒子(50.0) |
| idle | 空闲 | 标准球体，半径1.5，粒子15.0 |
| offline | 离线 | 低动画速度，深色 |
| reconnecting | 重连中 | 六边形粒子，中等动画 |
| listening | 倾听中 | 品红主色，高噪声幅度 |
| thinking | 思考中 | 四边形粒子，高速动画 |
| speaking | 回复中 | 圆形粒子，低动画速度 |
| error | 错误 | 三角形粒子，红黑配色 |
| show | 展示 | 小粒子(8.0)，大半径(3.0)，不旋转 |

统一预设值：
- `UNIFIED_RADIUS = 1.5`：统一半径（除 intro 和 show）
- `UNIFIED_PARTICLE_SIZE = 15.0`：统一粒子大小（除 intro、error、show）
- `UNIFIED_PARTICLE_COUNT = 6000`：统一粒子数量

## State Transitions

### 进入展示模式流程

1. 用户点击"展示"按钮
2. `handleShow()` 被调用：
   - 设置 `debugState = 'show'`
   - 设置 `fluidParams = statePresets.show`
   - 设置 `showContent = { type, content, options }`
3. `ZedAvatar` 的 `useEffect` 检测到 `showContent` 变化：
   - 调用 `ShowManager.showText/showEmoji/showImage/showShape()`
   - `ShowManager` 调用 `CanvasSampler` 采样内容
   - 调用 `FluidParticles.setShowContent(positions)`
4. `FluidParticles.setShowContent()`：
   - 设置 `pendingShowPositions = positions`
   - 设置 `isEnteringShowMode = true`
5. `FluidParticles.update()` 检测到 `isEnteringShowMode`：
   - 等待参数过渡完成（radius 和 particleSize 接近目标值）
   - 参数过渡完成后，设置 `showTargetPositions = pendingShowPositions`
   - 设置 `isShowMode = true`，`isEnteringShowMode = false`
6. `FluidParticles.update()` 检测到 `isShowMode`：
   - 粒子向 `showTargetPositions` 过渡（transitionSpeed = 0.05）

### 取消展示流程

1. 用户点击"取消"按钮
2. `handleCancelShow()` 被调用：
   - 设置 `showContent = null`
   - 保持 `fluidParams` 为 show 状态的参数
3. `ZedAvatar` 的 `useEffect` 检测到 `showContent = null`：
   - 如果 `isInShowMode()`，调用 `exitShow()`
   - 否则，调用 `cancelShow()`
4. `FluidParticles.cancelShow()`：
   - 清除 `pendingShowPositions`
   - 设置 `isEnteringShowMode = false`
   - 保持在 show 状态的参数（大球体）

### 退出展示模式流程

1. 用户点击"结束"按钮
2. `handleShowEnd()` 被调用：
   - 设置 `showContent = null`
   - 设置 `debugState = 'idle'`
   - 设置 `fluidParams = statePresets.idle`
3. `ZedAvatar` 的 `useEffect` 检测到 `showContent = null`：
   - 调用 `exitShow()`
4. `FluidParticles.exitShowMode()`：
   - 设置 `isShowMode = false`
   - 设置 `isExitingShowMode = true`
   - 清除 `pendingShowPositions`
5. `FluidParticles.update()` 检测到 `isExitingShowMode`：
   - 等待参数过渡完成（radius 和 particleSize 接近 idle 目标值）
   - 参数过渡完成后，计算球体目标位置 `sphereTargetPositions`
   - 粒子向 `sphereTargetPositions` 过渡
   - 位置过渡完成后，设置 `isExitingShowMode = false`

## Design Direction

- **视觉风格**: 玻璃拟态未来 (Glassmorphism) — 毛玻璃面板 + 渐变霓虹 (青 #4ecdc4 / 品红 #ff6b6b)
- **Zed 形象**: Three.js 流体粒子 (液态金属质感，随语音脉动变形)
- **对话展示**: 电影字幕式 — 当前对话浮于底部，历史对话折叠可展开
- **交互模式**: 语音优先，文字为辅

## Interaction Model

- **语音输入**: 默认按钮触发，可选开启 "Hey Zed" 语音唤醒
- **语音输出**: Kokoro TTS，播放时粒子形象跟随波形脉动
- **文字输入**: 点击键盘图标展开输入框
- **历史对话**: 点击 ☰ 按钮侧边滑出
- **展示功能**: 支持文字/Emoji/图片/图形展示为粒子形态
- **远程控制**: 通过 WebSocket 控制状态和参数

## Development Commands

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## WebSocket Control

WebSocket 服务器运行在 `ws://localhost:3001`，支持以下命令：

- `setState(state)`: 设置状态
- `setParams(params)`: 设置参数
- `show(type, content, options)`: 展示内容
- `showEnd()`: 结束展示

## Key Parameters

### FluidParams

| 参数 | 类型 | 描述 | 范围 |
|------|------|------|------|
| particleCount | number | 粒子数量 | 1000-20000 |
| particleSize | number | 粒子大小 | 1-20 |
| particleSides | number | 粒子形状（0=圆, 3=三角, 4=方, 5+=多边形） | 0-8 |
| radius | number | 球体半径 | 1-5 |
| animSpeed | number | 动画速度 | 0.1-2 |
| noiseAmplitude | number | 噪声幅度 | 0-1 |
| breathSpeed | number | 呼吸速度 | 0.5-3 |
| breathAmplitude | number | 呼吸幅度 | 0-0.3 |
| rotationSpeed | number | 旋转速度 | 0-0.5 |
| colorMixSpeed | number | 颜色混合速度 | 0.1-2 |
| glowIntensity | number | 辉光强度 | 0-1 |
| alphaBase | number | 基础透明度 | 0.1-1 |
| primaryColor | string | 主色调（十六进制） | - |
| secondaryColor | string | 次色调（十六进制） | - |

## Important Notes

1. **状态过渡**：状态切换时，参数会通过 lerp 平滑过渡（lerpSpeed = 0.03）
2. **展示模式**：进入展示模式时，会等待参数过渡完成后再开始位置过渡
3. **取消展示**：取消展示时，会保持在 show 状态的参数（大球体），不会立即恢复
4. **退出展示**：退出展示时，会等待参数过渡完成后再恢复球体位置
5. **粒子重建**：当 particleCount 或 particleSides 差异足够大时，会重建粒子系统
6. **Canvas 采样**：使用黄金比例（0.618）计算最大展示尺寸，确保内容不变形
