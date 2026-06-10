# Show 展示态设计方案

## 概述

开发一个新的特殊状态 "show"（展示态），粒子不再形成球体，而是展示各种形状和效果，支持文字、emoji、图片、图形等内容。

## 核心思路

**Canvas 采样法**：使用离屏 Canvas 渲染目标内容（文字/emoji/图片），采样像素点位置，让粒子移动到这些位置形成图案。

```
目标内容 → Canvas 渲染 → 像素采样 → 3D 坐标映射 → 粒子目标位置
```

## 支持的内容类型

| 类型 | 示例 | 实现方式 | 支持格式 |
|------|------|----------|----------|
| 文字 | "Hello", "你好" | Canvas fillText | UTF-8 字符串 |
| Emoji | "😀", "🎉" | Canvas fillText | Unicode emoji |
| 图片 | logo、图标 | Canvas drawImage | URL、Base64 |
| 简单图形 | 心形、星形 | Canvas 2D 路径绘制 | 预定义图形名 |

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    AI (Claude Code)                      │
│                  调用 zedface-control skill              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP API
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Control Server (Node.js)                    │
│  POST /api/control                                      │
│  { action: "show", type: "text", content: "Hello" }    │
└────────────────────────┬────────────────────────────────┘
                         │ WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ Canvas       │    │ Particle     │                  │
│  │ Sampler      │───▶│ Position     │                  │
│  │ (离屏Canvas) │    │ Generator    │                  │
│  └──────────────┘    └──────┬───────┘                  │
│                              │                         │
│                              ▼                         │
│                       ┌──────────────┐                 │
│                       │ FluidParticles│                │
│                       │ (粒子系统)    │                │
│                       └──────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## 核心模块设计

### 1. Canvas 采样器 (`src/utils/CanvasSampler.ts`)

```typescript
interface SampleOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  zIndex?: number; // Z 轴深度
}

class CanvasSampler {
  // 采样文字
  sampleText(text: string, options?: SampleOptions): Float32Array
  
  // 采样 Emoji
  sampleEmoji(emoji: string, options?: SampleOptions): Float32Array
  
  // 采样图片（支持 URL 和 Base64）
  sampleImage(source: string, options?: SampleOptions): Promise<Float32Array>
  
  // 采样图形
  sampleShape(shape: ShapeType, options?: SampleOptions): Float32Array
  
  // 通用采样方法
  private sample(canvas: HTMLCanvasElement, maxPoints: number): Float32Array
}
```

### 2. 采样流程

```
1. 创建离屏 Canvas（尺寸根据内容自适应）
2. 渲染内容到 Canvas
   - 文字/Emoji：使用 fillText
   - 图片：使用 drawImage（支持 URL 和 Base64）
   - 图形：使用 Canvas 2D API 绘制路径
3. 获取 ImageData
4. 遍历像素，提取非透明点（alpha > threshold）
5. 坐标转换：2D Canvas → 3D 空间
   - X, Y 映射到 [-radius, radius] 范围
   - Z 添加轻微随机深度（可选，增加立体感）
6. 点数处理：
   - 如果点数 > particleCount，随机采样
   - 如果点数 < particleCount，重复使用
7. 返回目标位置数组（Float32Array）
```

### 3. FluidParticles 扩展

```typescript
class FluidParticles {
  // 新增：展示模式目标位置
  private showTargetPositions: Float32Array | null = null
  private isShowMode: boolean = false
  private showTransitionProgress: number = 0 // 0-1，过渡进度
  
  // 新增：设置展示内容
  setShowContent(positions: Float32Array): void {
    this.showTargetPositions = positions
    this.isShowMode = true
    this.showTransitionProgress = 0
  }
  
  // 新增：退出展示模式
  exitShowMode(): void {
    this.isShowMode = false
    this.showTransitionProgress = 0
  }
  
  // 修改：update 方法
  update(time: number, audioIntensity: number = 0) {
    // ... 现有逻辑 ...
    
    if (this.isShowMode && this.showTargetPositions) {
      // 展示模式：粒子向目标位置过渡
      this.showTransitionProgress = Math.min(1, this.showTransitionProgress + 0.02)
      
      const positions = this.particles.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < this.currentParams.particleCount; i++) {
        const i3 = i * 3
        // 从当前位置平滑过渡到目标位置
        positions[i3] = lerp(positions[i3], this.showTargetPositions[i3], 0.05)
        positions[i3 + 1] = lerp(positions[i3 + 1], this.showTargetPositions[i3 + 1], 0.05)
        positions[i3 + 2] = lerp(positions[i3 + 2], this.showTargetPositions[i3 + 2], 0.05)
      }
      this.particles.geometry.attributes.position.needsUpdate = true
    }
  }
}
```

## 控制指令设计

### 展示文字
```json
{
  "action": "show",
  "type": "text",
  "content": "Hello",
  "options": {
    "fontSize": 100,
    "fontFamily": "Arial",
    "color": "#4ecdc4"
  }
}
```

### 展示 Emoji
```json
{
  "action": "show",
  "type": "emoji",
  "content": "😀",
  "options": {
    "fontSize": 200
  }
}
```

### 展示图片（URL）
```json
{
  "action": "show",
  "type": "image",
  "content": "https://example.com/logo.png",
  "options": {
    "width": 300,
    "height": 300
  }
}
```

### 展示图片（Base64）
```json
{
  "action": "show",
  "type": "image",
  "content": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "options": {
    "width": 300,
    "height": 300
  }
}
```

### 展示图形
```json
{
  "action": "show",
  "type": "shape",
  "content": "heart",
  "options": {
    "size": 200
  }
}
```

支持的图形：`heart`, `star`, `circle`, `triangle`, `square`

### 退出展示模式
```json
{
  "action": "showEnd"
}
```

## 状态预设

```typescript
// statePresets.ts 新增 show 状态
show: {
  particleCount: UNIFIED_PARTICLE_COUNT,
  particleSize: 8.0,  // 展示模式粒子更小，更精细
  particleSides: 0,
  radius: 3.0,        // 展示区域大小
  animSpeed: 0.1,     // 展示时动画较慢
  noiseAmplitude: 0.05,
  breathSpeed: 0.3,
  breathAmplitude: 0.02,
  rotationSpeed: 0.02,
  colorMixSpeed: 0.2,
  glowIntensity: 0.6,
  alphaBase: 0.8,
  primaryColor: '#4ecdc4',
  secondaryColor: '#ffffff',
}
```

## 过渡动画

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  球体    │───▶│  扩散    │───▶│  成型    │───▶│  展示    │
│ (idle)  │    │         │    │         │    │ (show)  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
     │                                              │
     │◀─────────────────────────────────────────────│
     │                   恢复球体                    │
```

- **进入展示**：先扩散（粒子散开），再聚合成目标形状
- **退出展示**：粒子散开，再聚合成球体

## 文件结构

```
src/
├── utils/
│   └── CanvasSampler.ts      # Canvas 采样器
├── show/
│   ├── ShowManager.ts        # 展示管理器
│   └── shapes.ts             # 预定义图形路径
└── hooks/
    └── useControlSocket.ts   # 扩展支持 show 指令
```

## 性能考虑

1. **采样优化**：采样只在内容变化时执行，不是每帧采样
2. **Canvas 优化**：使用 OffscreenCanvas（如浏览器支持）
3. **点数限制**：限制最大采样点数（与粒子数量匹配）
4. **图片处理**：图片展示时先缩放到合适尺寸再采样
5. **缓存机制**：相同内容的采样结果可以缓存

## 实现步骤

### Phase 1: 基础框架
1. 创建 CanvasSampler 类
2. 实现文字采样
3. 扩展 FluidParticles 支持展示模式
4. 添加 show 状态预设

### Phase 2: 内容类型支持
5. 实现 Emoji 采样
6. 实现图片采样（URL + Base64）
7. 实现预定义图形采样

### Phase 3: 控制集成
8. 更新控制服务器支持 show 指令
9. 更新前端 WebSocket 处理
10. 更新 zedface-control Skill 文档

### Phase 4: 优化和测试
11. 过渡动画优化
12. 性能优化
13. 全面测试

## 扩展可能性

- **粒子动画效果**：波浪、闪烁、流动
- **多帧动画**：连续展示多个内容
- **粒子颜色渐变映射**：根据位置或时间变化颜色
- **3D 深度效果**：真正的 3D 展示
- **交互式展示**：鼠标/触摸交互

## 安全考虑

- **图片 URL**：需要验证 URL 合法性，防止 XSS
- **Base64**：限制最大长度，防止内存溢出
- **CORS**：跨域图片需要处理 CORS 问题

## 测试用例

1. 展示英文文字："Hello World"
2. 展示中文文字："你好世界"
3. 展示 Emoji：😀 🎉 ❤️
4. 展示图片（URL）
5. 展示图片（Base64）
6. 展示预定义图形
7. 状态切换过渡
8. 快速切换压力测试
9. 大图片性能测试
