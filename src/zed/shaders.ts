// src/zed/shaders.ts

export const vertexShader = `
  uniform float uTime;
  uniform float uAudioIntensity;
  uniform float uParticleSize;
  uniform float uAnimSpeed;
  uniform float uBreathSpeed;
  uniform float uBreathAmplitude;
  uniform float uNoiseAmplitude;
  uniform float uColorMixSpeed;
  uniform float uAlphaBase;
  uniform float uParticleSides;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;

  attribute float aScale;
  attribute float aRandomness;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // Fluid motion
    float noise = sin(pos.x * 2.0 + uTime * uAnimSpeed) *
                  cos(pos.y * 2.0 + uTime * uAnimSpeed * 0.6) *
                  sin(pos.z * 2.0 + uTime * uAnimSpeed * 1.2);

    pos += normal * noise * uNoiseAmplitude * (1.0 + uAudioIntensity * 2.0);

    // Breathing effect
    float breath = sin(uTime * uBreathSpeed) * uBreathAmplitude + 1.0;
    pos *= breath;

    // Audio reactivity
    pos *= 1.0 + uAudioIntensity * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aScale * uParticleSize * (1.0 / -mvPosition.z);

    // Color gradient (custom colors)
    float colorMix = (sin(uTime * uColorMixSpeed + aRandomness * 6.28) + 1.0) * 0.5;
    vColor = mix(uPrimaryColor, uSecondaryColor, colorMix);

    vAlpha = uAlphaBase + uAudioIntensity * 0.4;
  }
`

export const fragmentShader = `
  uniform float uGlowIntensity;
  uniform float uParticleSides;

  varying vec3 vColor;
  varying float vAlpha;

  float polygonShape(vec2 p, float sides) {
    if (sides < 3.0) {
      // Circle
      return 1.0 - smoothstep(0.4, 0.5, length(p));
    }

    float angle = atan(p.y, p.x);
    float segment = 6.28318 / sides;
    float r = length(p);
    float theta = mod(angle + segment * 0.5, segment) - segment * 0.5;
    float d = r * cos(theta) / cos(segment * 0.5);

    return 1.0 - smoothstep(0.45, 0.5, d);
  }

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);

    // Shape based on sides (0 = circle, 3+ = polygon)
    float shape = polygonShape(center, uParticleSides);

    // Glow effect
    float glow = exp(-length(center) * 3.0) * uGlowIntensity;

    gl_FragColor = vec4(vColor + glow, shape * vAlpha);
  }
`

