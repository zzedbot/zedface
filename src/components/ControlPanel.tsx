// src/components/ControlPanel.tsx

import { useState, type CSSProperties, type ChangeEvent } from 'react'
import { StateRegistry } from '../zed/states'
import type { ZedState, FluidParams } from '../types'

export type { FluidParams }

export const defaultFluidParams: FluidParams = {
  particleCount: 6000,
  particleSize: 15.0,
  particleSides: 0,
  radius: 1.5,
  animSpeed: 0.8,
  breathSpeed: 1.2,
  breathAmplitude: 0.15,
  noiseAmplitude: 0.5,
  rotationSpeed: 0.15,
  transitionSpeed: 0.08,
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

// 提取样式常量（避免每次渲染重建）
const styles = {
  toggleBtn: {
    position: 'fixed' as const,
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
  },
  panel: {
    position: 'fixed' as const,
    top: '60px',
    width: '300px',
    padding: '20px',
    background: 'rgba(15, 12, 41, 0.9)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(78, 205, 196, 0.2)',
    borderRadius: '12px',
    zIndex: 99,
    transition: 'left 0.3s ease',
    maxHeight: 'calc(100vh - 80px)',
    overflowY: 'auto' as const,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    gap: '12px',
  } as CSSProperties,
  label: {
    fontSize: '12px',
    color: '#4ecdc4',
    minWidth: '100px',
  } as CSSProperties,
  value: {
    fontSize: '11px',
    color: '#888',
    minWidth: '40px',
    textAlign: 'right' as const,
  },
  slider: {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: 'rgba(78, 205, 196, 0.2)',
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer',
  },
  sectionDivider: {
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: '11px',
    color: '#666',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
  },
}

// 通用滑块组件
interface SliderControlProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: (value: number) => string
  onChange: (value: number) => void
}

function SliderControl({ label, value, min, max, step, format, onChange }: SliderControlProps) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        style={styles.slider}
        aria-label={label}
      />
      <span style={styles.value}>{format ? format(value) : value.toFixed(2)}</span>
    </div>
  )
}

// 粒子形状显示
function formatParticleSides(sides: number): string {
  const map: Record<number, string> = { 0: '圆', 3: '△', 4: '□', 5: '⬠', 6: '⬡' }
  return map[sides] ?? `${sides}边`
}

// 展示类型
type ShowType = 'text' | 'emoji' | 'image' | 'shape'
const SHOW_TYPES: { key: ShowType; label: string }[] = [
  { key: 'text', label: '文字' },
  { key: 'emoji', label: 'Emoji' },
  { key: 'image', label: '图片' },
  { key: 'shape', label: '图形' },
]

const SHAPES = ['heart', 'star', 'circle', 'triangle', 'square'] as const
const SHAPE_ICONS: Record<string, string> = {
  heart: '❤️', star: '⭐', circle: '⚪', triangle: '△', square: '□',
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
  const [showType, setShowType] = useState<ShowType>('text')
  const [showContent, setShowContent] = useState('Hello')

  const handleChange = (key: keyof FluidParams, value: number) => {
    onChange({ ...params, [key]: value })
  }

  const currentBehavior = StateRegistry.get(currentState)
  const stateInfo_ = { label: currentBehavior?.label ?? currentState, color: currentBehavior?.color ?? '#4ecdc4' }
  const allStates = StateRegistry.getIds()
  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(78, 205, 196, 0.2)',
    borderRadius: '4px',
    color: '#e0e0ff',
    marginBottom: '8px',
  }

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} style={styles.toggleBtn} title="流体参数设置" aria-label="切换控制面板">
        ⚙
      </button>

      <div style={{ ...styles.panel, left: isOpen ? '16px' : '-320px' }}>
        <h3 style={{ fontSize: '14px', color: '#4ecdc4', marginBottom: '16px' }}>流体参数调节</h3>

        {/* Mode Toggle */}
        <div style={styles.sectionDivider}>
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
                <span style={{ fontSize: '12px', color: stateInfo_.color, fontWeight: 'bold' }}>{stateInfo_.label}</span>
              </div>

              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>快速切换:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                {allStates.map((stateId) => {
                  const behavior = StateRegistry.get(stateId)!
                  const isActive = currentState === stateId
                  return (
                    <button
                      key={stateId}
                      onClick={() => onStateChange?.(stateId)}
                      aria-label={`切换到${behavior.label}状态`}
                      style={{
                        padding: '6px 4px',
                        fontSize: '10px',
                        background: isActive ? `${behavior.color}22` : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isActive ? behavior.color : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '4px',
                        color: isActive ? behavior.color : '#888',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center' as const,
                      }}
                    >
                      {behavior.label}
                    </button>
                  )
                })}
              </div>

              {/* Show Content Section */}
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(78, 205, 196, 0.05)', borderRadius: '6px', border: '1px solid rgba(78, 205, 196, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#4ecdc4', marginBottom: '8px', fontWeight: 'bold' }}>📺 展示内容</div>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  {SHOW_TYPES.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setShowType(key)}
                      style={{
                        flex: 1,
                        padding: '4px',
                        fontSize: '10px',
                        background: showType === key ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${showType === key ? 'rgba(78, 205, 196, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '4px',
                        color: showType === key ? '#4ecdc4' : '#888',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {showType === 'text' && (
                  <textarea
                    value={showContent}
                    onChange={(e) => setShowContent(e.target.value)}
                    placeholder="输入文字内容，支持换行（回车键）"
                    rows={3}
                    style={{ ...inputStyle, fontSize: '11px', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                )}
                {showType === 'emoji' && (
                  <input type="text" value={showContent} onChange={(e) => setShowContent(e.target.value)} placeholder="输入 Emoji，如 😀 🎉 ❤️" style={{ ...inputStyle, fontSize: '14px' }} />
                )}
                {showType === 'image' && (
                  <input type="text" value={showContent} onChange={(e) => setShowContent(e.target.value)} placeholder="输入图片 URL 或 Base64" style={{ ...inputStyle, fontSize: '10px' }} />
                )}
                {showType === 'shape' && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {SHAPES.map((shape) => (
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
                        {SHAPE_ICONS[shape]}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onShow?.(showType, showContent)}
                    disabled={!showContent}
                    aria-label="展示内容"
                    style={{
                      flex: 1, padding: '6px',
                      background: showContent ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(78, 205, 196, 0.3)', borderRadius: '4px',
                      color: showContent ? '#4ecdc4' : '#666', fontSize: '11px',
                      cursor: showContent ? 'pointer' : 'not-allowed',
                    }}
                  >
                    展示
                  </button>
                  <button onClick={() => onCancelShow?.()} aria-label="取消展示" style={{ flex: 1, padding: '6px', background: 'rgba(255, 165, 2, 0.1)', border: '1px solid rgba(255, 165, 2, 0.3)', borderRadius: '4px', color: '#ffa502', fontSize: '11px', cursor: 'pointer' }}>
                    取消
                  </button>
                  <button onClick={() => onShowEnd?.()} aria-label="结束展示" style={{ flex: 1, padding: '6px', background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '4px', color: '#ff6b6b', fontSize: '11px', cursor: 'pointer' }}>
                    结束
                  </button>
                </div>
              </div>
            </>
          )}

          {!usePreset && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>手动调节参数，实时应用到粒子系统</div>
          )}
        </div>

        {/* Particle Section */}
        <div style={styles.sectionDivider}>
          <div style={styles.sectionTitle}>粒子</div>
          <SliderControl label="粒子数量" value={params.particleCount} min={1000} max={20000} step={1000} format={(v) => String(v)} onChange={(v) => handleChange('particleCount', v)} />
          <SliderControl label="球体半径" value={params.radius} min={1} max={5} step={0.1} onChange={(v) => handleChange('radius', v)} />
          <SliderControl label="粒子大小" value={params.particleSize} min={1} max={20} step={0.5} onChange={(v) => handleChange('particleSize', v)} />
          <SliderControl label="粒子形状" value={params.particleSides} min={0} max={8} step={1} format={formatParticleSides} onChange={(v) => handleChange('particleSides', v)} />
        </div>

        {/* Animation Section */}
        <div style={styles.sectionDivider}>
          <div style={styles.sectionTitle}>动画</div>
          <SliderControl label="动画速度" value={params.animSpeed} min={0.1} max={2} step={0.1} onChange={(v) => handleChange('animSpeed', v)} />
          <SliderControl label="噪声幅度" value={params.noiseAmplitude} min={0} max={1} step={0.05} onChange={(v) => handleChange('noiseAmplitude', v)} />
          <SliderControl label="呼吸速度" value={params.breathSpeed} min={0.5} max={3} step={0.1} onChange={(v) => handleChange('breathSpeed', v)} />
          <SliderControl label="呼吸幅度" value={params.breathAmplitude} min={0} max={0.3} step={0.01} onChange={(v) => handleChange('breathAmplitude', v)} />
          <SliderControl label="旋转速度" value={params.rotationSpeed} min={0} max={0.5} step={0.01} onChange={(v) => handleChange('rotationSpeed', v)} />
          <SliderControl label="过渡速度" value={params.transitionSpeed} min={0.01} max={0.3} step={0.01} onChange={(v) => handleChange('transitionSpeed', v)} />
        </div>

        {/* Visual Section */}
        <div>
          <div style={styles.sectionTitle}>视觉</div>
          <SliderControl label="颜色混合速度" value={params.colorMixSpeed} min={0.1} max={2} step={0.1} onChange={(v) => handleChange('colorMixSpeed', v)} />
          <SliderControl label="辉光强度" value={params.glowIntensity} min={0} max={1} step={0.05} onChange={(v) => handleChange('glowIntensity', v)} />
          <SliderControl label="基础透明度" value={params.alphaBase} min={0.1} max={1} step={0.05} onChange={(v) => handleChange('alphaBase', v)} />

          <div style={styles.row}>
            <span style={styles.label}>主色调</span>
            <input type="color" value={params.primaryColor} onChange={(e) => onChange({ ...params, primaryColor: e.target.value })} aria-label="主色调" style={{ width: '40px', height: '24px', border: '1px solid rgba(78, 205, 196, 0.3)', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }} />
            <span style={styles.value}>{params.primaryColor}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>次色调</span>
            <input type="color" value={params.secondaryColor} onChange={(e) => onChange({ ...params, secondaryColor: e.target.value })} aria-label="次色调" style={{ width: '40px', height: '24px', border: '1px solid rgba(78, 205, 196, 0.3)', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }} />
            <span style={styles.value}>{params.secondaryColor}</span>
          </div>
        </div>

        <button
          onClick={() => onChange(defaultFluidParams)}
          style={{ marginTop: '16px', width: '100%', padding: '8px', background: 'rgba(78, 205, 196, 0.1)', border: '1px solid rgba(78, 205, 196, 0.3)', borderRadius: '6px', color: '#4ecdc4', fontSize: '12px', cursor: 'pointer' }}
        >
          重置为默认值
        </button>
      </div>
    </>
  )
}
