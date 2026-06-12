import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 配置
const PORT = process.env.PORT || 3001;

// 安全：必须通过环境变量设置 token，拒绝使用默认值
const AUTH_TOKEN = process.env.ZEDFACE_TOKEN;
if (!AUTH_TOKEN) {
  console.error('ERROR: ZEDFACE_TOKEN environment variable is required.');
  console.error('Set it with: ZEDFACE_TOKEN=your-secret-token npm start');
  process.exit(1);
}

const MAX_CONTENT_LENGTH = 10000;
const WS_OPEN = 1; // WebSocket.OPEN

// 允许的指令类型
const ALLOWED_ACTIONS = [
  'setState',
  'setParam',
  'setParams',
  'getStatus',
  'applyPreset',
  'show',
  'showEnd',
];

// 允许的状态
const ALLOWED_STATES = [
  'intro', 'idle', 'offline', 'reconnecting',
  'listening', 'thinking', 'speaking', 'error', 'show'
];

// 允许的参数（包含 transitionSpeed）
const ALLOWED_PARAMS = [
  'particleCount', 'particleSize', 'particleSides', 'radius',
  'animSpeed', 'noiseAmplitude', 'breathSpeed', 'breathAmplitude',
  'rotationSpeed', 'colorMixSpeed', 'glowIntensity', 'alphaBase',
  'primaryColor', 'secondaryColor', 'transitionSpeed'
];

// 允许的预设
const ALLOWED_PRESETS = ['calm', 'energetic', 'alert', 'sleeping'];

// CORS：限制来源
const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json({ limit: '100kb' }));

// 认证中间件
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
};

// 当前状态
let currentState = {
  state: 'idle',
  params: {
    particleSize: 15.0,
    radius: 1.5,
    animSpeed: 0.5,
    noiseAmplitude: 0.3,
    rotationSpeed: 0.1,
    transitionSpeed: 0.08,
  }
};

// 验证指令
function validateCommand(command) {
  if (!command || typeof command !== 'object') {
    return { valid: false, error: 'Command must be an object' };
  }

  const { action } = command;

  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return { valid: false, error: `Action '${action}' not allowed` };
  }

  switch (action) {
    case 'setState':
      if (!command.state || !ALLOWED_STATES.includes(command.state)) {
        return { valid: false, error: `State '${command.state}' not allowed` };
      }
      break;
    case 'setParam':
      if (!command.param || !ALLOWED_PARAMS.includes(command.param)) {
        return { valid: false, error: `Param '${command.param}' not allowed` };
      }
      break;
    case 'setParams':
      if (!command.params || typeof command.params !== 'object') {
        return { valid: false, error: 'setParams requires params object' };
      }
      for (const param of Object.keys(command.params)) {
        if (!ALLOWED_PARAMS.includes(param)) {
          return { valid: false, error: `Param '${param}' not allowed` };
        }
      }
      break;
    case 'applyPreset':
      if (!command.preset || !ALLOWED_PRESETS.includes(command.preset)) {
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
      if (typeof command.content === 'string' && command.content.length > MAX_CONTENT_LENGTH) {
        return { valid: false, error: `Content too long (max ${MAX_CONTENT_LENGTH} chars)` };
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
    case 'applyPreset': {
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
    }
    case 'show':
      currentState.state = 'show';
      currentState.showContent = {
        type: command.type,
        content: command.content,
        options: command.options || {}
      };
      break;
    case 'showEnd':
      currentState.state = 'idle';
      currentState.showContent = null;
      break;
    case 'getStatus':
      return res.json(currentState);
  }

  // 广播到所有已认证的 WebSocket 客户端
  wss.clients.forEach(client => {
    if (client.readyState === WS_OPEN && client.isAuthenticated) {
      client.send(JSON.stringify(command));
    }
  });

  res.json({ success: true, state: currentState });
});

app.get('/api/status', authenticate, (req, res) => {
  res.json(currentState);
});

// WebSocket 连接（需要认证）
wss.on('connection', (ws) => {
  ws.isAuthenticated = false;

  // 等待认证消息
  const authTimeout = setTimeout(() => {
    if (!ws.isAuthenticated) {
      console.log('WebSocket auth timeout, closing');
      ws.close(4001, 'Authentication timeout');
    }
  }, 5000);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (!ws.isAuthenticated) {
        // 第一条消息必须是认证
        if (message.action === 'auth' && message.token === AUTH_TOKEN) {
          ws.isAuthenticated = true;
          ws.send(JSON.stringify({ action: 'authOk' }));
          // 发送当前状态
          ws.send(JSON.stringify({ action: 'init', currentState }));
          console.log('Frontend authenticated');
        } else {
          ws.close(4002, 'Invalid credentials');
        }
        return;
      }

      // 已认证的消息忽略（控制通过 HTTP API）
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    clearTimeout(authTimeout);
    console.log('Frontend disconnected');
  });

  ws.on('error', (error) => {
    clearTimeout(authTimeout);
    console.error('WebSocket error:', error);
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`\n🎮 ZedFace Control Server`);
  console.log(`   HTTP: http://localhost:${PORT}`);
  console.log(`   WS:   ws://localhost:${PORT}`);
  console.log(`   Auth: token required (env ZEDFACE_TOKEN)`);
  console.log(`\nAllowed actions: ${ALLOWED_ACTIONS.join(', ')}`);
  console.log(`Allowed states: ${ALLOWED_STATES.join(', ')}\n`);
});
