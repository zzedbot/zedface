import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 配置
const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.ZEDFACE_TOKEN || 'zedface-control-2024';

// 允许的指令类型
const ALLOWED_ACTIONS = [
  'setState',      // 设置状态
  'setParam',      // 设置单个参数
  'setParams',     // 批量设置参数
  'getStatus',     // 获取当前状态
  'applyPreset',   // 应用预设场景
  'show',          // 展示内容（文字/emoji/图片/图形）
  'showEnd',       // 结束展示模式
];

// 允许的状态
const ALLOWED_STATES = [
  'intro', 'idle', 'offline', 'reconnecting',
  'listening', 'thinking', 'speaking', 'error', 'show'
];

// 允许的参数
const ALLOWED_PARAMS = [
  'particleCount', 'particleSize', 'particleSides', 'radius',
  'animSpeed', 'noiseAmplitude', 'breathSpeed', 'breathAmplitude',
  'rotationSpeed', 'colorMixSpeed', 'glowIntensity', 'alphaBase',
  'primaryColor', 'secondaryColor'
];

// 允许的预设
const ALLOWED_PRESETS = ['calm', 'energetic', 'alert', 'sleeping'];

// 中间件
app.use(cors());
app.use(express.json());

// 认证中间件
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
};

// 当前状态（内存存储）
let currentState = {
  state: 'idle',
  params: {
    particleSize: 15.0,
    radius: 1.5,
    animSpeed: 0.5,
    noiseAmplitude: 0.3,
    rotationSpeed: 0.1,
  }
};

// 验证指令
function validateCommand(command) {
  const { action } = command;

  if (!ALLOWED_ACTIONS.includes(action)) {
    return { valid: false, error: `Action '${action}' not allowed` };
  }

  switch (action) {
    case 'setState':
      if (!ALLOWED_STATES.includes(command.state)) {
        return { valid: false, error: `State '${command.state}' not allowed` };
      }
      break;
    case 'setParam':
      if (!ALLOWED_PARAMS.includes(command.param)) {
        return { valid: false, error: `Param '${command.param}' not allowed` };
      }
      break;
    case 'setParams':
      for (const param of Object.keys(command.params)) {
        if (!ALLOWED_PARAMS.includes(param)) {
          return { valid: false, error: `Param '${param}' not allowed` };
        }
      }
      break;
    case 'applyPreset':
      if (!ALLOWED_PRESETS.includes(command.preset)) {
        return { valid: false, error: `Preset '${command.preset}' not allowed` };
      }
      break;
    case 'show':
      if (!command.type || !command.content) {
        return { valid: false, error: 'Show action requires type and content' };
      }
      if (!['text', 'emoji', 'image', 'shape'].includes(command.type)) {
        return { valid: false, error: `Show type '${command.type}' not allowed` };
      }
      break;
  }

  return { valid: true };
}

// HTTP API 端点
app.post('/api/control', authenticate, (req, res) => {
  const command = req.body;
  const validation = validateCommand(command);

  if (!validation.valid) {
    return res.status(400).json(validation);
  }

  // 更新当前状态
  switch (command.action) {
    case 'setState':
      currentState.state = command.state;
      break;
    case 'setParam':
      currentState.params[command.param] = command.value;
      break;
    case 'setParams':
      Object.assign(currentState.params, command.params);
      break;
    case 'applyPreset':
      // 预设场景映射
      const presets = {
        calm: { state: 'idle', params: { animSpeed: 0.3, noiseAmplitude: 0.2 } },
        energetic: { state: 'thinking', params: { animSpeed: 1.5, noiseAmplitude: 1.0 } },
        alert: { state: 'listening', params: { animSpeed: 0.8, noiseAmplitude: 0.8 } },
        sleeping: { state: 'offline', params: { animSpeed: 0.1, noiseAmplitude: 0.05 } },
      };
      const preset = presets[command.preset];
      if (preset) {
        currentState.state = preset.state;
        Object.assign(currentState.params, preset.params);
      }
      break;
    case 'show':
      // 展示内容：自动切换到 show 状态
      currentState.state = 'show';
      currentState.showContent = {
        type: command.type,
        content: command.content,
        options: command.options || {}
      };
      break;
    case 'showEnd':
      // 结束展示模式：切换回 idle 状态
      currentState.state = 'idle';
      currentState.showContent = null;
      break;
    case 'getStatus':
      return res.json(currentState);
  }

  // 广播到所有 WebSocket 客户端
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(command));
    }
  });

  res.json({ success: true, state: currentState });
});

app.get('/api/status', authenticate, (req, res) => {
  res.json(currentState);
});

// WebSocket 连接
wss.on('connection', (ws) => {
  console.log('Frontend connected');

  // 发送当前状态
  ws.send(JSON.stringify({ action: 'init', state: currentState }));

  ws.on('close', () => {
    console.log('Frontend disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`\n🎮 ZedFace Control Server`);
  console.log(`   HTTP: http://localhost:${PORT}`);
  console.log(`   WS:   ws://localhost:${PORT}`);
  console.log(`   Token: ${AUTH_TOKEN.substring(0, 4)}...${AUTH_TOKEN.substring(AUTH_TOKEN.length - 4)}`);
  console.log(`\nAllowed actions: ${ALLOWED_ACTIONS.join(', ')}`);
  console.log(`Allowed states: ${ALLOWED_STATES.join(', ')}\n`);
});
