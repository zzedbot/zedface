// src/components/ControlPanel.tsx

import { useState, type ChangeEvent } from 'react'
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
    <div className="flex items-center justify-between mb-3 gap-3">
      <span className="text-xs text-primary min-w-[100px]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-sm bg-primary/20 outline-none appearance-none cursor-pointer"
        aria-label={label}
      />
      <span className="text-[11px] text-text-secondary min-w-[40px] text-right">
        {format ? format(value) : value.toFixed(2)}
      </span>
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

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base text-text-secondary z-[100] backdrop-blur-[10px] transition-colors hover:text-primary hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
        title="流体参数设置"
        aria-label="切换控制面板"
      >
        ⚙
      </button>

      <div
        className="fixed top-[60px] w-full max-w-[300px] p-5 bg-[rgba(15,12,41,0.9)] backdrop-blur-[20px] border border-primary/20 rounded-xl z-[99] transition-[left] duration-300 max-h-[calc(100vh-80px)] overflow-y-auto"
        style={{ left: isOpen ? '16px' : '-320px' }}
      >
        <h3 className="text-sm text-primary mb-4">流体参数调节</h3>

        {/* Mode Toggle */}
        <div className="mb-4 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-secondary">模式</span>
            <button
              onClick={onPresetToggle}
              className={`px-3 py-1 text-[11px] rounded cursor-pointer transition-colors ${
                usePreset
                  ? 'bg-primary/20 border border-primary/50 text-primary'
                  : 'bg-white/5 border border-white/10 text-text-secondary'
              }`}
            >
              {usePreset ? '🎭 状态预设' : '⚙ 手动控制'}
            </button>
          </div>

          {usePreset && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] text-text-secondary/70">当前状态:</span>
                <span className="text-xs font-bold" style={{ color: stateInfo_.color }}>{stateInfo_.label}</span>
              </div>

              <div className="text-[11px] text-text-secondary/70 mb-2">快速切换:</div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {allStates.map((stateId) => {
                  const behavior = StateRegistry.get(stateId)!
                  const isActive = currentState === stateId
                  return (
                    <button
                      key={stateId}
                      onClick={() => onStateChange?.(stateId)}
                      aria-label={`切换到${behavior.label}状态`}
                      className="py-1.5 px-1 text-[10px] rounded cursor-pointer transition-all text-center"
                      style={{
                        background: isActive ? `${behavior.color}22` : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isActive ? behavior.color : 'rgba(255, 255, 255, 0.08)'}`,
                        color: isActive ? behavior.color : '#888',
                      }}
                    >
                      {behavior.label}
                    </button>
                  )
                })}
              </div>

              {/* Show Content Section */}
              <div className="mt-3 p-3 bg-primary/5 rounded-md border border-primary/20">
                <div className="text-[11px] text-primary mb-2 font-bold">📺 展示内容</div>

                <div className="flex gap-1 mb-2">
                  {SHOW_TYPES.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setShowType(key)}
                      className={`flex-1 py-1 text-[10px] rounded cursor-pointer transition-colors ${
                        showType === key
                          ? 'bg-primary/20 border border-primary/50 text-primary'
                          : 'bg-white/3 border border-white/8 text-text-secondary'
                      }`}
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
                    className="w-full px-2 py-1.5 bg-black/30 border border-primary/20 rounded text-text-primary text-[11px] mb-2 resize-vertical font-[inherit] focus:border-primary/50 focus:outline-none"
                  />
                )}
                {showType === 'emoji' && (
                  <input
                    type="text"
                    value={showContent}
                    onChange={(e) => setShowContent(e.target.value)}
                    placeholder="输入 Emoji，如 😀 🎉 ❤️"
                    className="w-full px-2 py-1.5 bg-black/30 border border-primary/20 rounded text-text-primary text-sm mb-2 focus:border-primary/50 focus:outline-none"
                  />
                )}
                {showType === 'image' && (
                  <input
                    type="text"
                    value={showContent}
                    onChange={(e) => setShowContent(e.target.value)}
                    placeholder="输入图片 URL 或 Base64"
                    className="w-full px-2 py-1.5 bg-black/30 border border-primary/20 rounded text-text-primary text-[10px] mb-2 focus:border-primary/50 focus:outline-none"
                  />
                )}
                {showType === 'shape' && (
                  <div className="flex gap-1 mb-2">
                    {SHAPES.map((shape) => (
                      <button
                        key={shape}
                        onClick={() => setShowContent(shape)}
                        className={`flex-1 py-1 text-[9px] rounded cursor-pointer transition-colors ${
                          showContent === shape
                            ? 'bg-primary/20 border border-primary/50 text-primary'
                            : 'bg-white/3 border border-white/8 text-text-secondary'
                        }`}
                      >
                        {SHAPE_ICONS[shape]}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-1.5">
                  <button
                    onClick={() => onShow?.(showType, showContent)}
                    disabled={!showContent}
                    aria-label="展示内容"
                    className={`flex-1 py-1.5 rounded text-[11px] transition-colors ${
                      showContent
                        ? 'bg-primary/20 border border-primary/30 text-primary cursor-pointer hover:bg-primary/30'
                        : 'bg-white/3 border border-primary/30 text-text-secondary/70 cursor-not-allowed'
                    }`}
                  >
                    展示
                  </button>
                  <button
                    onClick={() => onCancelShow?.()}
                    aria-label="取消展示"
                    className="flex-1 py-1.5 bg-warning/10 border border-warning/30 rounded text-warning text-[11px] cursor-pointer transition-colors hover:bg-warning/20"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => onShowEnd?.()}
                    aria-label="结束展示"
                    className="flex-1 py-1.5 bg-secondary/10 border border-secondary/30 rounded text-secondary text-[11px] cursor-pointer transition-colors hover:bg-secondary/20"
                  >
                    结束
                  </button>
                </div>
              </div>
            </>
          )}

          {!usePreset && (
            <div className="text-[11px] text-text-secondary/70 mt-2">手动调节参数，实时应用到粒子系统</div>
          )}
        </div>

        {/* Particle Section */}
        <div className="mb-4 pb-4 border-b border-white/5">
          <div className="text-[11px] text-text-secondary/70 mb-2 uppercase">粒子</div>
          <SliderControl label="粒子数量" value={params.particleCount} min={1000} max={20000} step={1000} format={(v) => String(v)} onChange={(v) => handleChange('particleCount', v)} />
          <SliderControl label="球体半径" value={params.radius} min={1} max={5} step={0.1} onChange={(v) => handleChange('radius', v)} />
          <SliderControl label="粒子大小" value={params.particleSize} min={1} max={20} step={0.5} onChange={(v) => handleChange('particleSize', v)} />
          <SliderControl label="粒子形状" value={params.particleSides} min={0} max={8} step={1} format={formatParticleSides} onChange={(v) => handleChange('particleSides', v)} />
        </div>

        {/* Animation Section */}
        <div className="mb-4 pb-4 border-b border-white/5">
          <div className="text-[11px] text-text-secondary/70 mb-2 uppercase">动画</div>
          <SliderControl label="动画速度" value={params.animSpeed} min={0.1} max={2} step={0.1} onChange={(v) => handleChange('animSpeed', v)} />
          <SliderControl label="噪声幅度" value={params.noiseAmplitude} min={0} max={1} step={0.05} onChange={(v) => handleChange('noiseAmplitude', v)} />
          <SliderControl label="呼吸速度" value={params.breathSpeed} min={0.5} max={3} step={0.1} onChange={(v) => handleChange('breathSpeed', v)} />
          <SliderControl label="呼吸幅度" value={params.breathAmplitude} min={0} max={0.3} step={0.01} onChange={(v) => handleChange('breathAmplitude', v)} />
          <SliderControl label="旋转速度" value={params.rotationSpeed} min={0} max={0.5} step={0.01} onChange={(v) => handleChange('rotationSpeed', v)} />
          <SliderControl label="过渡速度" value={params.transitionSpeed} min={0.01} max={0.3} step={0.01} onChange={(v) => handleChange('transitionSpeed', v)} />
        </div>

        {/* Visual Section */}
        <div>
          <div className="text-[11px] text-text-secondary/70 mb-2 uppercase">视觉</div>
          <SliderControl label="颜色混合速度" value={params.colorMixSpeed} min={0.1} max={2} step={0.1} onChange={(v) => handleChange('colorMixSpeed', v)} />
          <SliderControl label="辉光强度" value={params.glowIntensity} min={0} max={1} step={0.05} onChange={(v) => handleChange('glowIntensity', v)} />
          <SliderControl label="基础透明度" value={params.alphaBase} min={0.1} max={1} step={0.05} onChange={(v) => handleChange('alphaBase', v)} />

          <div className="flex items-center justify-between mb-3 gap-3">
            <span className="text-xs text-primary min-w-[100px]">主色调</span>
            <input
              type="color"
              value={params.primaryColor}
              onChange={(e) => onChange({ ...params, primaryColor: e.target.value })}
              aria-label="主色调"
              className="w-10 h-6 border border-primary/30 rounded bg-transparent cursor-pointer"
            />
            <span className="text-[11px] text-text-secondary min-w-[40px] text-right">{params.primaryColor}</span>
          </div>
          <div className="flex items-center justify-between mb-3 gap-3">
            <span className="text-xs text-primary min-w-[100px]">次色调</span>
            <input
              type="color"
              value={params.secondaryColor}
              onChange={(e) => onChange({ ...params, secondaryColor: e.target.value })}
              aria-label="次色调"
              className="w-10 h-6 border border-primary/30 rounded bg-transparent cursor-pointer"
            />
            <span className="text-[11px] text-text-secondary min-w-[40px] text-right">{params.secondaryColor}</span>
          </div>
        </div>

        <button
          onClick={() => onChange(defaultFluidParams)}
          className="mt-4 w-full py-2 bg-primary/10 border border-primary/30 rounded-md text-primary text-xs cursor-pointer transition-colors hover:bg-primary/20"
        >
          重置为默认值
        </button>
      </div>
    </>
  )
}
