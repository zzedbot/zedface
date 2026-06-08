// src/components/ControlPanel.tsx

import { useState } from 'react'

export interface FluidParams {
  // Particle settings
  particleCount: number
  radius: number

  // Animation
  animSpeed: number
  breathSpeed: number
  breathAmplitude: number
  noiseAmplitude: number
  rotationSpeed: number

  // Visual
  colorMixSpeed: number
  glowIntensity: number
  alphaBase: number
}

export const defaultFluidParams: FluidParams = {
  particleCount: 12000,
  radius: 2.5,
  animSpeed: 0.8,
  breathSpeed: 1.2,
  breathAmplitude: 0.15,
  noiseAmplitude: 0.5,
  rotationSpeed: 0.15,
  colorMixSpeed: 0.5,
  glowIntensity: 0.5,
  alphaBase: 0.6,
}

interface ControlPanelProps {
  params: FluidParams
  onChange: (params: FluidParams) => void
}

export function ControlPanel({ params, onChange }: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (key: keyof FluidParams, value: number) => {
    onChange({ ...params, [key]: value })
  }

  const sliderStyle = {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: 'rgba(78, 205, 196, 0.2)',
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer',
  }

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    gap: '12px',
  }

  const labelStyle = {
    fontSize: '12px',
    color: '#4ecdc4',
    minWidth: '100px',
  }

  const valueStyle = {
    fontSize: '11px',
    color: '#888',
    minWidth: '40px',
    textAlign: 'right' as const,
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: '#888',
          zIndex: 100,
          backdropFilter: 'blur(10px)',
        }}
        title="流体参数设置"
      >
        ⚙
      </button>

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '60px',
          left: isOpen ? '16px' : '-320px',
          width: '300px',
          padding: '20px',
          background: 'rgba(15, 12, 41, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(78, 205, 196, 0.2)',
          borderRadius: '12px',
          zIndex: 99,
          transition: 'left 0.3s ease',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ fontSize: '14px', color: '#4ecdc4', marginBottom: '16px' }}>
          流体参数调节
        </h3>

        {/* Particle Section */}
        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>粒子</div>

          <div style={rowStyle}>
            <span style={labelStyle}>粒子数量</span>
            <input
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={params.particleCount}
              onChange={(e) => handleChange('particleCount', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.particleCount}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>球体半径</span>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={params.radius}
              onChange={(e) => handleChange('radius', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.radius.toFixed(1)}</span>
          </div>
        </div>

        {/* Animation Section */}
        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>动画</div>

          <div style={rowStyle}>
            <span style={labelStyle}>动画速度</span>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={params.animSpeed}
              onChange={(e) => handleChange('animSpeed', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.animSpeed.toFixed(1)}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>噪声幅度</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={params.noiseAmplitude}
              onChange={(e) => handleChange('noiseAmplitude', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.noiseAmplitude.toFixed(2)}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>呼吸速度</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={params.breathSpeed}
              onChange={(e) => handleChange('breathSpeed', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.breathSpeed.toFixed(1)}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>呼吸幅度</span>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={params.breathAmplitude}
              onChange={(e) => handleChange('breathAmplitude', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.breathAmplitude.toFixed(2)}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>旋转速度</span>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={params.rotationSpeed}
              onChange={(e) => handleChange('rotationSpeed', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.rotationSpeed.toFixed(2)}</span>
          </div>
        </div>

        {/* Visual Section */}
        <div>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>视觉</div>

          <div style={rowStyle}>
            <span style={labelStyle}>颜色混合速度</span>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={params.colorMixSpeed}
              onChange={(e) => handleChange('colorMixSpeed', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.colorMixSpeed.toFixed(1)}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>辉光强度</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={params.glowIntensity}
              onChange={(e) => handleChange('glowIntensity', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.glowIntensity.toFixed(2)}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>基础透明度</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={params.alphaBase}
              onChange={(e) => handleChange('alphaBase', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.alphaBase.toFixed(2)}</span>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => onChange(defaultFluidParams)}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '8px',
            background: 'rgba(78, 205, 196, 0.1)',
            border: '1px solid rgba(78, 205, 196, 0.3)',
            borderRadius: '6px',
            color: '#4ecdc4',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          重置为默认值
        </button>
      </div>
    </>
  )
}
