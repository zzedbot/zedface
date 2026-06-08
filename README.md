# Zed AI

赛博朋克风格的多模态 AI 交互界面。

## Features

- 🎭 **Three.js 流体粒子动画** — 液态金属质感，随语音脉动
- 🎤 **语音交互** — 本地 Whisper STT + Kokoro TTS
- 💬 **字幕式对话** — 电影字幕风格展示
- 🌊 **声波波形** — 实时音频可视化
- 🎨 **玻璃拟态 UI** — 毛玻璃面板 + 渐变霓虹
- 📂 **历史对话** — 可折叠的历史记录面板

## Tech Stack

- React 18 + TypeScript + Vite
- Three.js (流体粒子)
- Whisper (本地语音识别)
- Kokoro (本地语音合成)
- OpenClaw API

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Prerequisites

- Node.js 18+
- Local Whisper deployment (STT)
- Local Kokoro deployment (TTS)

## Project Structure

```
src/
├── components/   # UI components
├── zed/          # Three.js particle system
├── voice/        # Voice processing hooks
├── api/          # OpenClaw API client
├── hooks/        # React hooks
└── types/        # TypeScript types
```

## License

MIT
