// src/components/FloatingWindow/FloatingWindow.tsx

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { FloatingWindowProps } from './types'
import { getCellSize, gridToPixel } from './gridUtils'
import { useDrag } from './useDrag'
import { useResize } from './useResize'

export function FloatingWindow({
  title,
  children,
  isOpen = true,
  gridCols = 12,
  gridRows = 8,
  initialCol = 1,
  initialRow = 1,
  initialWidth = 4,
  initialHeight = 3,
  minWidth = 2,
  minHeight = 2,
  maxWidth,
  maxHeight,
  onClose,
  onMinimize,
  onPositionChange,
  onSizeChange,
}: FloatingWindowProps) {
  const [col, setCol] = useState(initialCol)
  const [row, setRow] = useState(initialRow)
  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(initialHeight)
  const [isMinimized, setIsMinimized] = useState(false)

  // 窗口 resize 时强制重新渲染（更新格位尺寸）
  const [, setViewportSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const cellSize = useMemo(() => getCellSize(gridCols, gridRows), [gridCols, gridRows])

  // 默认的 maxWidth/maxHeight
  const effectiveMaxWidth = maxWidth ?? gridCols
  const effectiveMaxHeight = maxHeight ?? gridRows

  // 位置变化回调（仅通知外部消费者，state 同步由 useEffect 处理）
  const handlePositionChange = useCallback(
    (newCol: number, newRow: number) => {
      onPositionChange?.(newCol, newRow)
    },
    [onPositionChange],
  )

  // 大小变化回调（仅通知外部消费者，state 同步由 useEffect 处理）
  const handleSizeChange = useCallback(
    (newWidth: number, newHeight: number) => {
      onSizeChange?.(newWidth, newHeight)
    },
    [onSizeChange],
  )

  // 拖拽 Hook
  const drag = useDrag({
    cellSize,
    gridCols,
    gridRows,
    windowWidth: width,
    windowHeight: height,
    onPositionChange: handlePositionChange,
  })

  // 缩放 Hook
  const resize = useResize({
    cellSize,
    gridCols,
    gridRows,
    minWidth,
    minHeight,
    maxWidth: effectiveMaxWidth,
    maxHeight: effectiveMaxHeight,
    onSizeChange: handleSizeChange,
  })

  // 同步拖拽/缩放的位置和大小到组件 state
  useEffect(() => {
    if (drag.isDragging) {
      setCol(drag.col)
      setRow(drag.row)
    }
  }, [drag.isDragging, drag.col, drag.row])

  useEffect(() => {
    if (resize.isResizing) {
      setWidth(resize.width)
      setHeight(resize.height)
    }
  }, [resize.isResizing, resize.width, resize.height])

  // 最小化切换
  const handleMinimizeToggle = useCallback(() => {
    const newMinimized = !isMinimized
    setIsMinimized(newMinimized)
    onMinimize?.()
  }, [isMinimized, onMinimize])

  // 计算像素位置和尺寸
  const pixelPos = useMemo(() => gridToPixel(col, row, cellSize), [col, row, cellSize])
  const pixelWidth = width * cellSize.w
  const pixelHeight = isMinimized ? 40 : height * cellSize.h // 最小化时只显示标题栏

  // 不打开时不渲染
  if (!isOpen) return null

  // 标题栏高度
  const titleBarHeight = 40

  return (
    <div
      style={{
        position: 'fixed',
        left: pixelPos.x,
        top: pixelPos.y,
        width: pixelWidth,
        height: pixelHeight,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        boxShadow: '0 0 20px rgba(78, 205, 196, 0.2)',
        overflow: 'hidden',
        transition: drag.isDragging || resize.isResizing ? 'none' : 'height 0.3s ease',
      }}
    >
      {/* 标题栏 */}
      <div
        onMouseDown={(e) => drag.onMouseDown(e, col, row)}
        style={{
          height: titleBarHeight,
          minHeight: titleBarHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: drag.isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#4ecdc4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title || 'Window'}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* 最小化按钮 */}
          <button
            onClick={handleMinimizeToggle}
            aria-label={isMinimized ? '恢复窗口' : '最小化窗口'}
            style={{
              fontSize: '16px',
              color: '#888',
              padding: '2px 6px',
              borderRadius: '4px',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#4ecdc4'
              e.currentTarget.style.background = 'rgba(78, 205, 196, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#888'
              e.currentTarget.style.background = 'none'
            }}
          >
            −
          </button>

          {/* 关闭按钮 */}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="关闭窗口"
              style={{
                fontSize: '16px',
                color: '#888',
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ff6b6b'
                e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888'
                e.currentTarget.style.background = 'none'
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      {!isMinimized && (
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '12px',
          }}
        >
          {children}
        </div>
      )}

      {/* 缩放手柄（右下角） */}
      {!isMinimized && (
        <div
          onMouseDown={(e) => resize.onMouseDown(e, width, height, col, row)}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '16px',
            height: '16px',
            cursor: 'nwse-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5'
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M9 1L1 9M9 5L5 9" stroke="#4ecdc4" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  )
}
