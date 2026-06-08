# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Zed** — 赛博朋克风格的多模态 AI 交互 Web 界面。以语音交互为主，视觉优先，Zed 是一个有形象、有性格的 AI 角色。

## Tech Stack

- **前端框架**: React 18+ (函数组件 + Hooks)
- **构建工具**: Vite
- **3D 动画**: Three.js (流体粒子效果)
- **AI 后端**: OpenClaw — `https://zedbot.kingdee.space`
  - Agent session: `agent:main:dashboard:04f68817-c66c-4baf-a85d-474521783a71`
- **语音识别 (STT)**: 本地部署 Whisper
- **语音合成 (TTS)**: 本地部署 Kokoro

## Architecture

```
src/
├── components/       # UI 组件 (字幕、控制栏、历史面板等)
├── zed/              # Three.js 流体粒子形象模块
├── voice/            # 语音处理 (Whisper STT + Kokoro TTS + 波形)
├── api/              # OpenClaw API 对接
├── hooks/            # 自定义 React Hooks
└── styles/           # 全局样式 & 主题变量
```

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

## Commands

(TBD — 项目初始化后补充)
