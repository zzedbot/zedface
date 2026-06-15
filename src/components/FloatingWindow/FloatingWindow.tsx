// src/components/FloatingWindow/FloatingWindow.tsx

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { FloatingWindowProps } from './types'
import { getCellSize, gridToPixel } from './gridUtils'
import { useDrag } from './useDrag'
import { useResize } from './useResize'
import { GridOverlay } from './GridOverlay'

export function FloatingWindow({
  title,
  children,
  isOpen = true,
  isMinimized = false,
  isMaximized = false,
  minimizedIndex = 0,
  zIndex = 50,
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
  onMaximize,
  onFocus,
  onPositionChange,
  onSizeChange,
}: FloatingWindowProps) {
  const [col, setCol] = useState(initialCol)
  const [row, setRow] = useState(initialRow)
  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(initialHeight)

  // 同步外部位置/大小变化（如最大化/恢复）
  useEffect(() => {
    setCol(initialCol)
    setRow(initialRow)
    setWidth(initialWidth)
    setHeight(initialHeight)
  }, [initialCol, initialRow, initialWidth, initialHeight])

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

  // 最小化切换（由父组件控制状态）
  const handleMinimizeToggle = useCallback(() => {
    onMinimize?.()
  }, [onMinimize])

  // 计算像素位置和尺寸
  const pixelPos = useMemo(() => gridToPixel(col, row, cellSize), [col, row, cellSize])
  const pixelWidth = width * cellSize.w
  const pixelHeight = height * cellSize.h

  // 不打开时不渲染
  if (!isOpen) return null

  // 标题栏高度
  const titleBarHeight = 40

  // 是否正在拖拽或缩放
  const isInteracting = drag.isDragging || resize.isResizing

  // 最小化时渲染为左侧圆形图标 + 窗口名称
  if (isMinimized) {
    const pillTop = 80 + minimizedIndex * 50
    return (
      <div
        onClick={handleMinimizeToggle}
        onMouseDown={onFocus}
        role="button"
        aria-label={`恢复窗口: ${title}`}
        style={{
          position: 'fixed',
          left: '12px',
          top: `${pillTop}px`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px 6px 6px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(78, 205, 196, 0.3)',
          borderRadius: '20px',
          cursor: 'pointer',
          zIndex,
          boxShadow: '0 0 12px rgba(78, 205, 196, 0.15)',
          transition: 'all 0.2s ease',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(78, 205, 196, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.5)'
          e.currentTarget.style.boxShadow = '0 0 16px rgba(78, 205, 196, 0.25)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.3)'
          e.currentTarget.style.boxShadow = '0 0 12px rgba(78, 205, 196, 0.15)'
        }}
      >
        {/* 圆形图标 */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(255, 107, 107, 0.2))',
            border: '1px solid rgba(78, 205, 196, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="#4ecdc4" strokeWidth="1.5" />
          </svg>
        </div>
        {/* 窗口名称 */}
        <span
          style={{
            fontSize: '12px',
            color: '#e0e0ff',
            whiteSpace: 'nowrap',
            maxWidth: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title || 'Window'}
        </span>
      </div>
    )
  }

  return (
    <>
      {/* 网格覆盖层：拖拽/缩放时显示 */}
      {isInteracting && (
        <GridOverlay
          gridCols={gridCols}
          gridRows={gridRows}
          highlightCol={col}
          highlightRow={row}
          highlightWidth={width}
          highlightHeight={height}
        />
      )}

      <div
      onMouseDown={onFocus}
      style={{
        position: 'fixed',
        left: pixelPos.x,
        top: pixelPos.y,
        width: pixelWidth,
        height: pixelHeight,
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        boxShadow: '0 0 20px rgba(78, 205, 196, 0.2)',
        overflow: 'hidden',
        transition: drag.isDragging || resize.isResizing ? 'none' : 'all 0.2s ease',
      }}
    >
      {/* 标题栏 */}
      <div
        onMouseDown={(e) => {
          // 点击按钮时不触发拖拽
          const target = e.target as HTMLElement
          if (target.closest('button')) return
          if (!isMaximized) {
            drag.onMouseDown(e, col, row)
          }
        }}
        onDoubleClick={(e) => {
          // 双击按钮时不触发最大化
          const target = e.target as HTMLElement
          if (target.closest('button')) return
          onMaximize?.()
        }}
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
            aria-label="最小化窗口"
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
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* 最大化按钮 */}
          {onMaximize && (
            <button
              onClick={onMaximize}
              aria-label={isMaximized ? '恢复窗口大小' : '最大化窗口'}
              style={{
                fontSize: '14px',
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
              {isMaximized ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="3" y="0.5" width="8.5" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="0.5" y="3" width="8.5" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="rgba(0,0,0,0.3)" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          )}

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
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px',
        }}
      >
        {children}
      </div>

      {/* 缩放手柄（右下角） */}
      {!isMaximized && (
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
    </>
  )
}
