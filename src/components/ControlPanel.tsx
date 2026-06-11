// src/components/ControlPanel.tsx

import { useState } from 'react'
import { stateInfo, statePresets } from '../zed/statePresets'
import type { ZedState } from '../types'

export interface FluidParams {
  // Particle settings
  particleCount: number
  particleSize: number
  particleSides: number // 0=circle, 3=triangle, 4=square, 5=pentagon...
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
  primaryColor: string
  secondaryColor: string
}

export const defaultFluidParams: FluidParams = {
  particleCount: 6000,
  particleSize: 15.0,
  particleSides: 0, // 0=circle, 3=triangle, 4=square...
  radius: 1.5,
  animSpeed: 0.8,
  breathSpeed: 1.2,
  breathAmplitude: 0.15,
  noiseAmplitude: 0.5,
  rotationSpeed: 0.15,
  colorMixSpeed: 0.5,
  glowIntensity: 0.5,
  alphaBase: 0.6,
  primaryColor: '#4ecdc4',
  secondaryColor: '#ff6b6b',
}

interface ControlPanelProps {
  params: FluidParams
  onChange: (params: FluidParams) => void
  usePreset?: boolean
  onPresetToggle?: () => void
  currentState?: ZedState
  onStateChange?: (state: ZedState) => void
  onShow?: (type: 'text' | 'emoji' | 'image' | 'shape', content: string, options?: any) => void
  onShowEnd?: () => void
  onCancelShow?: () => void
}

export function ControlPanel({
  params,
  onChange,
  usePreset = false,
  onPresetToggle,
  currentState = 'idle',
  onStateChange,
  onShow,
  onShowEnd,
  onCancelShow,
}: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showType, setShowType] = useState<'text' | 'emoji' | 'image' | 'shape'>('text')
  const [showContent, setShowContent] = useState('Hello')

  const handleChange = (key: keyof FluidParams, value: number) => {
    onChange({ ...params, [key]: value })
  }

  const stateLabel = stateInfo[currentState].label
  const stateColor = stateInfo[currentState].color
  const allStates = Object.keys(statePresets) as ZedState[]

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
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ fontSize: '14px', color: '#4ecdc4', marginBottom: '16px' }}>
          流体参数调节
        </h3>

        {/* Mode Toggle */}
        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>模式</span>
            <button
              onClick={onPresetToggle}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                background: usePreset ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${usePreset ? 'rgba(78, 205, 196, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '4px',
                color: usePreset ? '#4ecdc4' : '#888',
                cursor: 'pointer',
              }}
            >
              {usePreset ? '🎭 状态预设' : '⚙ 手动控制'}
            </button>
          </div>

          {usePreset && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: '#666' }}>当前状态:</span>
                <span style={{ fontSize: '12px', color: stateColor, fontWeight: 'bold' }}>
                  {stateLabel}
                </span>
              </div>

              {/* State Quick Switch Buttons */}
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>快速切换:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                {allStates.map((state) => {
                  const info = stateInfo[state]
                  const isActive = currentState === state
                  return (
                    <button
                      key={state}
                      onClick={() => onStateChange?.(state)}
                      style={{
                        padding: '6px 4px',
                        fontSize: '10px',
                        background: isActive ? `${info.color}22` : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isActive ? info.color : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '4px',
                        color: isActive ? info.color : '#888',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center' as const,
                      }}
                    >
                      {info.label}
                    </button>
                  )
                })}
              </div>

              {/* Show Content Section */}
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(78, 205, 196, 0.05)', borderRadius: '6px', border: '1px solid rgba(78, 205, 196, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#4ecdc4', marginBottom: '8px', fontWeight: 'bold' }}>📺 展示内容</div>

                {/* Show Type Selection */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  {(['text', 'emoji', 'image', 'shape'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setShowType(type)}
                      style={{
                        flex: 1,
                        padding: '4px',
                        fontSize: '10px',
                        background: showType === type ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${showType === type ? 'rgba(78, 205, 196, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '4px',
                        color: showType === type ? '#4ecdc4' : '#888',
                        cursor: 'pointer',
                      }}
                    >
                      {type === 'text' ? '文字' : type === 'emoji' ? 'Emoji' : type === 'image' ? '图片' : '图形'}
                    </button>
                  ))}
                </div>

                {/* Content Input */}
                {showType === 'text' && (
                  <textarea
                    value={showContent}
                    onChange={(e) => setShowContent(e.target.value)}
                    placeholder="输入文字内容，支持换行（回车键）"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(78, 205, 196, 0.2)',
                      borderRadius: '4px',
                      color: '#e0e0ff',
                      fontSize: '11px',
                      marginBottom: '8px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                )}

                {showType === 'emoji' && (
                  <input
                    type="text"
                    value={showContent}
                    onChange={(e) => setShowContent(e.target.value)}
                    placeholder="输入 Emoji，如 😀 🎉 ❤️"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(78, 205, 196, 0.2)',
                      borderRadius: '4px',
                      color: '#e0e0ff',
                      fontSize: '14px',
                      marginBottom: '8px',
                    }}
                  />
                )}

                {showType === 'image' && (
                  <input
                    type="text"
                    value={showContent}
                    onChange={(e) => setShowContent(e.target.value)}
                    placeholder="输入图片 URL 或 Base64"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(78, 205, 196, 0.2)',
                      borderRadius: '4px',
                      color: '#e0e0ff',
                      fontSize: '10px',
                      marginBottom: '8px',
                    }}
                  />
                )}

                {showType === 'shape' && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {['heart', 'star', 'circle', 'triangle', 'square'].map((shape) => (
                      <button
                        key={shape}
                        onClick={() => setShowContent(shape)}
                        style={{
                          flex: 1,
                          padding: '4px',
                          fontSize: '9px',
                          background: showContent === shape ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${showContent === shape ? 'rgba(78, 205, 196, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                          borderRadius: '4px',
                          color: showContent === shape ? '#4ecdc4' : '#888',
                          cursor: 'pointer',
                        }}
                      >
                        {shape === 'heart' ? '❤️' : shape === 'star' ? '⭐' : shape === 'circle' ? '⚪' : shape === 'triangle' ? '△' : '□'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Show/Cancel/End Buttons */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onShow?.(showType, showContent)}
                    disabled={!showContent}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: showContent ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(78, 205, 196, 0.3)',
                      borderRadius: '4px',
                      color: showContent ? '#4ecdc4' : '#666',
                      fontSize: '11px',
                      cursor: showContent ? 'pointer' : 'not-allowed',
                    }}
                  >
                    展示
                  </button>
                  <button
                    onClick={() => onCancelShow?.()}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: 'rgba(255, 165, 2, 0.1)',
                      border: '1px solid rgba(255, 165, 2, 0.3)',
                      borderRadius: '4px',
                      color: '#ffa502',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    取消
                  </button>
                  <button
                    onClick={() => onShowEnd?.()}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: 'rgba(255, 107, 107, 0.1)',
                      border: '1px solid rgba(255, 107, 107, 0.3)',
                      borderRadius: '4px',
                      color: '#ff6b6b',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    结束
                  </button>
                </div>
              </div>
            </>
          )}

          {!usePreset && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
              手动调节参数，实时应用到粒子系统
            </div>
          )}
        </div>

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

          <div style={rowStyle}>
            <span style={labelStyle}>粒子大小</span>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={params.particleSize}
              onChange={(e) => handleChange('particleSize', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{params.particleSize.toFixed(1)}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>粒子形状</span>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={params.particleSides}
              onChange={(e) => handleChange('particleSides', Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>
              {params.particleSides === 0 ? '圆' : params.particleSides === 3 ? '△' : params.particleSides === 4 ? '□' : params.particleSides === 5 ? '⬠' : params.particleSides === 6 ? '⬡' : `${params.particleSides}边`}
            </span>
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

          <div style={rowStyle}>
            <span style={labelStyle}>主色调</span>
            <input
              type="color"
              value={params.primaryColor}
              onChange={(e) => onChange({ ...params, primaryColor: e.target.value })}
              style={{
                width: '40px',
                height: '24px',
                border: '1px solid rgba(78, 205, 196, 0.3)',
                borderRadius: '4px',
                background: 'transparent',
                cursor: 'pointer',
              }}
            />
            <span style={valueStyle}>{params.primaryColor}</span>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>次色调</span>
            <input
              type="color"
              value={params.secondaryColor}
              onChange={(e) => onChange({ ...params, secondaryColor: e.target.value })}
              style={{
                width: '40px',
                height: '24px',
                border: '1px solid rgba(78, 205, 196, 0.3)',
                borderRadius: '4px',
                background: 'transparent',
                cursor: 'pointer',
              }}
            />
            <span style={valueStyle}>{params.secondaryColor}</span>
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
