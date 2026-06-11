# Zed AI

赛博朋克风格的多模态 AI 交互界面。以流体粒子动画为核心，支持多种状态切换和展示模式。

## ✨ Features

### 核心功能

- 🎭 **流体粒子系统** — Three.js 实现的流体粒子动画，支持多种状态和展示模式
- 🔄 **状态管理** — 支持 9 种状态：intro、idle、offline、reconnecting、listening、thinking、speaking、error、show
- 📺 **展示功能** — 支持将文字、Emoji、图片、图形展示为粒子形态
- 🎛️ **参数控制** — 实时调整粒子数量、大小、形状、动画速度、颜色等参数
- 🌐 **远程控制** — 通过 WebSocket 远程控制状态和参数

### 交互功能

- 🎤 **语音交互** — 本地 Whisper STT + Kokoro TTS
- 💬 **字幕式对话** — 电影字幕风格展示
- 🌊 **声波波形** — 实时音频可视化
- 🎨 **玻璃拟态 UI** — 毛玻璃面板 + 渐变霓虹
- 📂 **历史对话** — 可折叠的历史记录面板
- 📝 **调试日志** — 实时显示系统日志

## 🛠 Tech Stack

- **前端框架**: React 18+ (函数组件 + Hooks)
- **构建工具**: Vite
- **3D 动画**: Three.js (流体粒子效果)
- **AI 后端**: OpenClaw — `https://zedbot.kingdee.space`
- **语音识别**: 本地部署 Whisper
- **语音合成**: 本地部署 Kokoro
- **远程控制**: WebSocket (ws://localhost:3001)

## 📁 Project Structure

```
src/
├── components/           # UI 组件
│   ├── Header.tsx               # 顶部状态栏
│   ├── SubtitleDisplay.tsx      # 字幕式对话展示
│   ├── ControlBar.tsx           # 底部控制栏
│   ├── ControlPanel.tsx         # 流体参数控制面板
│   ├── HistoryPanel.tsx         # 历史对话面板
│   ├── TextInput.tsx            # 文字输入框
│   └── LogDisplay.tsx           # 调试日志显示
├── zed/                  # 3D 粒子系统
│   ├── ZedAvatar.tsx            # 3D 头像组件
│   ├── FluidParticles.ts      # 流体粒子系统核心
│   ├── shaders.ts             # GLSL 着色器
│   └── statePresets.ts        # 状态预设参数
├── show/                 # 展示功能
│   └── ShowManager.ts         # 展示管理器
├── voice/                # 语音处理
│   ├── WaveformDisplay.tsx    # 声波波形
│   ├── useVoiceRecorder.ts    # 录音 Hook
│   ├── useWhisper.ts          # Whisper STT
│   ├── useKokoro.ts           # Kokoro TTS
│   └── useVoiceWake.ts        # 语音唤醒
├── hooks/                # React Hooks
│   ├── useChat.ts             # 对话管理
│   └── useControlSocket.ts    # WebSocket 控制
├── utils/                # 工具类
│   ├── CanvasSampler.ts       # Canvas 采样器
│   └── Logger.ts              # 日志管理器
├── App.tsx               # 主应用
└── main.tsx              # 入口文件
```

## 🚀 Getting Started

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 📖 States

系统支持 9 种状态，每种状态都有独特的视觉效果：

| 状态 | 描述 | 特点 |
|------|------|------|
| **intro** | 初始化 | 粒子分散，大半径(8.0)，大粒子(50.0) |
| **idle** | 空闲 | 标准球体，半径1.5，粒子15.0 |
| **offline** | 离线 | 低动画速度，深色 |
| **reconnecting** | 重连中 | 六边形粒子，中等动画 |
| **listening** | 倾听中 | 品红主色，高噪声幅度 |
| **thinking** | 思考中 | 四边形粒子，高速动画 |
| **speaking** | 回复中 | 圆形粒子，低动画速度 |
| **error** | 错误 | 三角形粒子，红黑配色 |
| **show** | 展示 | 小粒子(8.0)，大半径(3.0)，不旋转 |

## 🎛️ Control Panel

控制面板提供以下调节功能：

### 粒子参数
- **粒子数量**：1000-20000
- **球体半径**：1-5
- **粒子大小**：1-20
- **粒子形状**：圆形(0)、三角形(3)、正方形(4)、五边形(5)、六边形(6)等

### 动画参数
- **动画速度**：0.1-2
- **噪声幅度**：0-1
- **呼吸速度**：0.5-3
- **呼吸幅度**：0-0.3
- **旋转速度**：0-0.5

### 视觉参数
- **颜色混合速度**：0.1-2
- **辉光强度**：0-1
- **基础透明度**：0.1-1
- **主色调**：十六进制颜色
- **次色调**：十六进制颜色

## 📺 Show Mode

展示模式支持将以下内容展示为粒子形态：

- **文字**：支持自动换行和缩放
- **Emoji**：自动缩放适应展示区域
- **图片**：支持 URL 和 Base64，自动缩放
- **图形**：预定义图形（heart、star、circle、triangle、square）

### 操作流程

1. **展示**：选择内容类型，输入内容，点击"展示"按钮
2. **取消**：点击"取消"按钮，保持在展示状态的参数（大球体）
3. **结束**：点击"结束"按钮，恢复到 idle 状态

## 🌐 WebSocket Control

WebSocket 服务器运行在 `ws://localhost:3001`，支持以下命令：

```javascript
// 设置状态
ws.send(JSON.stringify({ type: 'setState', state: 'idle' }))

// 设置参数
ws.send(JSON.stringify({ type: 'setParams', params: { particleSize: 15 } }))

// 展示内容
ws.send(JSON.stringify({ type: 'show', content: { type: 'text', content: 'Hello' } }))

// 结束展示
ws.send(JSON.stringify({ type: 'showEnd' }))
```

## 🔧 Development

### 项目依赖

- Node.js 18+
- React 18+
- Three.js
- Vite

### 本地服务

- **Whisper STT**: 本地语音识别服务
- **Kokoro TTS**: 本地语音合成服务
- **WebSocket Server**: 远程控制服务 (ws://localhost:3001)

## 📝 License

MIT

---

**Zed AI** — 让 AI 可视化，让交互更生动
