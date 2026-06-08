// src/zed/shaders.ts

export const vertexShader = `
  uniform float uTime;
  uniform float uAudioIntensity;
  uniform vec2 uMouse;

  attribute float aScale;
  attribute float aRandomness;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // Fluid motion - enhanced amplitude
    float noise = sin(pos.x * 2.0 + uTime * 0.8) *
                  cos(pos.y * 2.0 + uTime * 0.5) *
                  sin(pos.z * 2.0 + uTime * 1.0);

    pos += normal * noise * 0.5 * (1.0 + uAudioIntensity * 2.0);

    // Breathing effect - more pronounced
    float breath = sin(uTime * 1.2) * 0.15 + 1.0;
    pos *= breath;

    // Audio reactivity
    pos *= 1.0 + uAudioIntensity * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aScale * 8.0 * (1.0 / -mvPosition.z);

    // Color gradient (cyan to magenta)
    float colorMix = (sin(uTime * 0.5 + aRandomness * 6.28) + 1.0) * 0.5;
    vColor = mix(
      vec3(0.306, 0.804, 0.769), // #4ecdc4
      vec3(1.0, 0.420, 0.420),   // #ff6b6b
      colorMix
    );

    vAlpha = 0.6 + uAudioIntensity * 0.4;
  }
`

export const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Circular particle
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;

    // Glow effect
    float glow = exp(-dist * 3.0) * 0.5;

    gl_FragColor = vec4(vColor + glow, alpha);
  }
`
