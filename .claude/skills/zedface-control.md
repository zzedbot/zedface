# ZedFace Control Skill

Control the ZedFace 3D particle sphere through the control server API.

## When to Use

Use this skill when:
- User wants to change the sphere's state (idle, thinking, speaking, etc.)
- User wants to adjust particle parameters (size, radius, speed, etc.)
- User wants to apply preset scenes (calm, energetic, etc.)
- User asks to check current sphere status
- User wants to create visual effects or animations

## Configuration

- **Server URL**: http://localhost:3001
- **Auth Token**: Use environment variable `ZEDFACE_TOKEN` or default `zedface-control-2024`
- **WebSocket**: ws://localhost:3001 (auto-connected by frontend)

## Available Actions

### 1. Set State
Change the sphere's animation state.

**Allowed states**: `intro`, `idle`, `offline`, `reconnecting`, `listening`, `thinking`, `speaking`, `error`

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-2024" \
  -H "Content-Type: application/json" \
  -d '{"action": "setState", "state": "thinking"}'
```

### 2. Set Single Parameter
Adjust one parameter at a time.

**Allowed params**: `particleCount`, `particleSize`, `particleSides`, `radius`, `animSpeed`, `noiseAmplitude`, `breathSpeed`, `breathAmplitude`, `rotationSpeed`, `colorMixSpeed`, `glowIntensity`, `alphaBase`, `primaryColor`, `secondaryColor`

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-2024" \
  -H "Content-Type: application/json" \
  -d '{"action": "setParam", "param": "particleSize", "value": 20}'
```

### 3. Set Multiple Parameters
Adjust multiple parameters at once.

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "setParams",
    "params": {
      "particleSize": 15,
      "radius": 2.5,
      "animSpeed": 0.8
    }
  }'
```

### 4. Apply Preset Scene
Apply a predefined scene preset.

**Allowed presets**: `calm`, `energetic`, `alert`, `sleeping`

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-2024" \
  -H "Content-Type: application/json" \
  -d '{"action": "applyPreset", "preset": "energetic"}'
```

### 5. Get Current Status
Query the current sphere state and parameters.

```bash
curl -X GET http://localhost:3001/api/status \
  -H "Authorization: Bearer zedface-control-2024"
```

## Parameter Ranges and Guidelines

### Visual Parameters
- **particleSize**: 5-50 (default: 15) - Size of each particle
- **radius**: 1-10 (default: 1.5) - Sphere radius
- **particleCount**: 1000-20000 (default: 6000) - Number of particles
- **particleSides**: 0-8 (default: 0) - Shape (0=circle, 3=triangle, 4=square, 5+=polygon)

### Animation Parameters
- **animSpeed**: 0-2 (default: 0.5) - Overall animation speed
- **noiseAmplitude**: 0-2 (default: 0.3) - Noise/turbulence intensity
- **rotationSpeed**: 0-0.5 (default: 0.1) - Rotation speed
- **breathSpeed**: 0-3 (default: 0.8) - Breathing/pulsing speed
- **breathAmplitude**: 0-0.5 (default: 0.1) - Breathing intensity

### Visual Effects
- **glowIntensity**: 0-1 (default: 0.5) - Glow/bloom intensity
- **alphaBase**: 0.1-1 (default: 0.6) - Base transparency
- **colorMixSpeed**: 0-2 (default: 0.3) - Color transition speed

### Colors
- **primaryColor**: Hex color (default: "#4ecdc4") - Primary color (cyan)
- **secondaryColor**: Hex color (default: "#ff6b6b") - Secondary color (pink/red)

## State Descriptions

- **intro**: Initial state with particles dispersed (radius: 8.0)
- **idle**: Calm, breathing animation (default state)
- **offline**: Dim, slow movement (sleeping mode)
- **reconnecting**: Transitioning from offline to idle
- **listening**: Active, focused on audio input
- **thinking**: Fast, chaotic movement (processing)
- **speaking**: Flowing, expressive animation
- **error**: Glitchy, alert animation

## Preset Scenes

- **calm**: Relaxed, slow movement (idle state, low speed)
- **energetic**: Fast, chaotic (thinking state, high speed)
- **alert**: Focused, attentive (listening state)
- **sleeping**: Very slow, dim (offline state)

## Example Workflows

### Create a "Thinking" Effect
```bash
# Set to thinking state
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-2024" \
  -H "Content-Type: application/json" \
  -d '{"action": "setState", "state": "thinking"}'

# Adjust parameters for more intense effect
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "setParams",
    "params": {
      "animSpeed": 1.5,
      "noiseAmplitude": 1.0,
      "rotationSpeed": 0.3
    }
  }'
```

### Create Custom Color Scheme
```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "setParams",
    "params": {
      "primaryColor": "#6366f1",
      "secondaryColor": "#ec4899",
      "colorMixSpeed": 0.5
    }
  }'
```

### Check Current Status
```bash
curl -X GET http://localhost:3001/api/status \
  -H "Authorization: Bearer zedface-control-2024"
```

## Security Notes

- Always use the Authorization header with Bearer token
- Token can be customized via `ZEDFACE_TOKEN` environment variable
- Server only listens on localhost by default
- Only whitelisted actions and parameters are allowed

## Troubleshooting

**Connection refused**: Make sure the control server is running (`npm run server`)
**401 Unauthorized**: Check the Authorization header and token
**400 Bad Request**: Check action name and parameter names against allowed lists
**No visual change**: Check browser console for WebSocket connection status
