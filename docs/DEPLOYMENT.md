# Zed AI 部署文档

本文档详细说明如何部署 Zed AI 系统，包括前端应用、语音服务、WebSocket 服务等所有组件。

## 📋 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [前端部署](#前端部署)
- [语音服务部署](#语音服务部署)
- [WebSocket 服务部署](#websocket-服务部署)
- [生产环境部署](#生产环境部署)
- [配置说明](#配置说明)
- [常见问题](#常见问题)

---

## 环境要求

### 系统要求

- **操作系统**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **Git**: 2.20.0 或更高版本

### 硬件要求

#### 前端应用
- **CPU**: 2 核以上
- **内存**: 4GB 以上
- **磁盘**: 500MB 以上

#### Whisper STT（语音识别）
- **CPU**: 4 核以上（推荐 8 核）
- **内存**: 8GB 以上（推荐 16GB）
- **GPU**: NVIDIA GPU，显存 4GB 以上（可选，但强烈推荐）
- **磁盘**: 2GB 以上（模型文件）

#### Kokoro TTS（语音合成）
- **CPU**: 2 核以上
- **内存**: 4GB 以上
- **GPU**: NVIDIA GPU，显存 2GB 以上（可选，但推荐）
- **磁盘**: 1GB 以上（模型文件）

### 软件依赖

- **Python**: 3.8 或更高版本（用于 Whisper 和 Kokoro）
- **CUDA**: 11.8 或更高版本（如果使用 GPU）
- **cuDNN**: 8.6 或更高版本（如果使用 GPU）

---

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd zedface
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动前端

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 启动语音服务（可选）

参考 [语音服务部署](#语音服务部署)

### 5. 启动 WebSocket 服务（可选）

参考 [WebSocket 服务部署](#websocket-服务部署)

---

## 前端部署

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

### 生产环境构建

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

构建产物在 `dist/` 目录中。

### 部署到 Web 服务器

#### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/zedface/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Apache 配置

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/zedface/dist

    <Directory /path/to/zedface/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA 路由支持
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

---

## 语音服务部署

### Whisper STT（语音识别）

Whisper 是 OpenAI 开源的语音识别模型，用于将语音转换为文字。

#### 安装

```bash
# 创建虚拟环境
python -m venv whisper-env
source whisper-env/bin/activate  # Linux/macOS
# whisper-env\Scripts\activate   # Windows

# 安装 Whisper
pip install openai-whisper

# 安装 GPU 支持（可选）
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 启动服务

创建 `whisper-server.py`：

```python
from flask import Flask, request, jsonify
import whisper
import torch

app = Flask(__name__)

# 加载模型（可选：tiny, base, small, medium, large）
model = whisper.load_model("base")

# 使用 GPU（如果可用）
device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400
    
    audio_file = request.files['audio']
    
    # 保存临时文件
    temp_path = '/tmp/temp_audio.webm'
    audio_file.save(temp_path)
    
    # 转录
    result = model.transcribe(temp_path)
    
    # 删除临时文件
    import os
    os.remove(temp_path)
    
    return jsonify({
        'text': result['text'],
        'language': result['language']
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000)
```

启动服务：

```bash
python whisper-server.py
```

服务运行在 http://localhost:9000

#### 配置前端

在 `.env` 文件中配置：

```env
VITE_WHISPER_URL=http://localhost:9000/transcribe
```

### Kokoro TTS（语音合成）

Kokoro 是一个高质量的语音合成模型，用于将文字转换为语音。

#### 安装

```bash
# 创建虚拟环境
python -m venv kokoro-env
source kokoro-env/bin/activate  # Linux/macOS
# kokoro-env\Scripts\activate   # Windows

# 安装 Kokoro
pip install kokoro-tts

# 安装 GPU 支持（可选）
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 启动服务

创建 `kokoro-server.py`：

```python
from flask import Flask, request, send_file
from kokoro import KPipeline
import io
import soundfile as sf

app = Flask(__name__)

# 初始化 pipeline
pipeline = KPipeline(lang_code='a')  # 'a' for American English

@app.route('/tts', methods=['POST'])
def tts():
    data = request.json
    text = data.get('text', '')
    speaker = data.get('speaker', 'default')
    speed = data.get('speed', 1.0)
    
    # 生成语音
    audio_data = pipeline(text, voice=speaker, speed=speed)
    
    # 转换为音频文件
    audio_buffer = io.BytesIO()
    sf.write(audio_buffer, audio_data, 24000, format='WAV')
    audio_buffer.seek(0)
    
    return send_file(
        audio_buffer,
        mimetype='audio/wav',
        as_attachment=False,
        download_name='speech.wav'
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

启动服务：

```bash
python kokoro-server.py
```

服务运行在 http://localhost:8000

#### 配置前端

在 `.env` 文件中配置：

```env
VITE_KOKORO_URL=http://localhost:8000/tts
```

---

## WebSocket 服务部署

WebSocket 服务用于远程控制 Zed 的状态和参数。

### 安装依赖

```bash
cd websocket-server
npm install
```

### 启动服务

```bash
npm start
```

服务运行在 ws://localhost:3001

### 生产环境部署

使用 PM2 进行进程管理：

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start websocket-server.js --name zed-websocket

# 设置开机启动
pm2 startup
pm2 save
```

### 配置 Nginx 代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # WebSocket 代理
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 生产环境部署

### 完整部署架构

```
┌─────────────┐
│   Nginx     │
│  (反向代理)  │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  前端应用    │ │ Whisper STT │ │ Kokoro TTS  │
│  (端口 80)  │ │ (端口 9000) │ │ (端口 8000) │
└─────────────┘ └─────────────┘ └─────────────┘
       │
       ▼
┌─────────────┐
│  WebSocket  │
│ (端口 3001) │
└─────────────┘
```

### Docker 部署

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  # 前端应用
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - whisper
      - kokoro
      - websocket

  # Whisper STT
  whisper:
    build:
      context: .
      dockerfile: Dockerfile.whisper
    ports:
      - "9000:9000"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # Kokoro TTS
  kokoro:
    build:
      context: .
      dockerfile: Dockerfile.kokoro
    ports:
      - "8000:8000"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # WebSocket 服务
  websocket:
    build:
      context: ./websocket-server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
```

创建 `Dockerfile.frontend`：

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

创建 `Dockerfile.whisper`：

```dockerfile
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-whisper.txt .
RUN pip install --no-cache-dir -r requirements-whisper.txt

COPY whisper-server.py .

EXPOSE 9000

CMD ["python", "whisper-server.py"]
```

创建 `Dockerfile.kokoro`：

```dockerfile
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-kokoro.txt .
RUN pip install --no-cache-dir -r requirements-kokoro.txt

COPY kokoro-server.py .

EXPOSE 8000

CMD ["python", "kokoro-server.py"]
```

启动服务：

```bash
docker-compose up -d
```

---

## 配置说明

### 环境变量

创建 `.env` 文件：

```env
# Whisper STT 服务地址
VITE_WHISPER_URL=http://localhost:9000/transcribe

# Kokoro TTS 服务地址
VITE_KOKORO_URL=http://localhost:8000/tts

# WebSocket 服务地址
VITE_WEBSOCKET_URL=ws://localhost:3001

# OpenClaw API 地址
VITE_OPENCLAW_URL=https://zedbot.kingdee.space

# OpenClaw Agent Session
VITE_AGENT_SESSION=agent:main:dashboard:04f68817-c66c-4baf-a85d-474521783a71
```

### 配置加载顺序

1. `.env` - 默认环境变量
2. `.env.local` - 本地环境变量（不提交到 Git）
3. `.env.production` - 生产环境变量

---

## 常见问题

### 1. 前端无法连接语音服务

**问题**: 前端无法连接 Whisper 或 Kokoro 服务

**解决方案**:
- 检查服务是否启动：`curl http://localhost:9000/transcribe`
- 检查端口是否被占用：`netstat -ano | findstr :9000`
- 检查防火墙设置
- 检查 `.env` 配置是否正确

### 2. WebSocket 连接失败

**问题**: 无法连接 WebSocket 服务

**解决方案**:
- 检查服务是否启动：`telnet localhost 3001`
- 检查 Nginx 配置是否正确
- 检查防火墙是否允许 WebSocket 连接
- 检查浏览器控制台错误信息

### 3. GPU 加速不生效

**问题**: Whisper 或 Kokoro 没有使用 GPU

**解决方案**:
- 检查 CUDA 版本：`nvcc --version`
- 检查 PyTorch 是否支持 GPU：`python -c "import torch; print(torch.cuda.is_available())"`
- 重新安装支持 GPU 的 PyTorch：`pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118`

### 4. 内存不足

**问题**: 内存不足导致服务崩溃

**解决方案**:
- 增加系统内存
- 使用更小的模型（Whisper: tiny/base，Kokoro: 小模型）
- 使用 Docker 限制内存使用
- 使用 swap 空间

### 5. 性能优化

**建议**:
- 使用 GPU 加速
- 使用 CDN 加速前端资源
- 使用 Nginx 缓存静态资源
- 使用 Gzip 压缩
- 使用 HTTP/2

---

## 监控和日志

### 前端日志

浏览器控制台可以查看前端日志。

### 后端日志

```bash
# Whisper 日志
tail -f /var/log/whisper.log

# Kokoro 日志
tail -f /var/log/kokoro.log

# WebSocket 日志
tail -f /var/log/websocket.log
```

### 性能监控

使用 PM2 监控服务：

```bash
pm2 monit
```

---

## 安全建议

### 1. 使用 HTTPS

生产环境必须使用 HTTPS，保护数据传输安全。

### 2. 配置 CORS

配置 WebSocket 和 API 的 CORS 策略，只允许特定域名访问。

### 3. 限制访问

使用 Nginx 限制访问 IP，只允许特定 IP 访问。

### 4. 定期更新

定期更新依赖和系统，修复安全漏洞。

---

## 维护

### 备份

定期备份配置文件和日志文件。

### 更新

```bash
# 更新前端
git pull
npm install
npm run build

# 更新语音服务
git pull
pip install -r requirements.txt
```

### 清理

```bash
# 清理日志
find /var/log -name "*.log" -mtime +30 -delete

# 清理临时文件
rm -rf /tmp/temp_audio.*
```

---

**最后更新**: 2026-06-10
