// src/components/FloatingWindow/FloatingWindow.tsx

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { FloatingWindowProps } from './types'
import { getCellSize, gridToPixel } from './gridUtils'
import { useDrag } from './useDrag'
import { useResize } from './useResize'
import { GridOverlay } from './GridOverlay'
import { useMinimizedWindows } from '../../hooks/useMinimizedWindows'

const DRAG_THRESHOLD = 4
const MINIMIZED_PILL_TOP = 80
const MINIMIZED_PILL_GAP = 50
const SORT_HYSTERESIS = 0.65

export function FloatingWindow({
  windowId,
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
  const {
    minimizedIndex: registeredMinimizedIndex,
    minimizedCount,
    register: registerMinimized,
    unregister: unregisterMinimized,
    reorder: reorderMinimized,
  } = useMinimizedWindows(windowId ?? '')
  const [isDraggingToClose, setIsDraggingToClose] = useState(false)
  const isDraggingToCloseRef = useRef(false)
  const hasDraggedToCloseRef = useRef(false)
  const suppressNextClickRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const dragStartIndexRef = useRef(0)
  const dragCurrentIndexRef = useRef(0)
  const dragFrameRef = useRef<number | null>(null)
  const pendingDragPointRef = useRef({ x: 0, y: 0 })
  const dragCleanupRef = useRef<() => void>(() => {})
  const pillRef = useRef<HTMLDivElement>(null)
  const closeZoneRef = useRef<HTMLDivElement>(null)

  const isInsideCloseZone = useCallback((clientX: number, clientY: number) => {
    const rect = closeZoneRef.current?.getBoundingClientRect()
    if (!rect) return false
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
  }, [])

  const resetPillStyles = useCallback(() => {
    if (!pillRef.current) return
    pillRef.current.style.transform = ''
    pillRef.current.style.opacity = '1'
    pillRef.current.style.transition = ''
    pillRef.current.style.willChange = ''
  }, [])

  useEffect(() => () => dragCleanupRef.current(), [])

  useEffect(() => {
    if (!windowId) return
    if (isMinimized) {
      registerMinimized()
    } else {
      unregisterMinimized()
    }
    return unregisterMinimized
  }, [isMinimized, registerMinimized, unregisterMinimized, windowId])

  // 最小化窗口的拖拽关闭处理
  const handleMinimizedMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isMinimized) return
    e.preventDefault()
    dragCleanupRef.current()
    onFocus?.()
    isDraggingToCloseRef.current = true
    hasDraggedToCloseRef.current = false
    suppressNextClickRef.current = false
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    dragStartIndexRef.current = registeredMinimizedIndex
    dragCurrentIndexRef.current = registeredMinimizedIndex
    setIsDraggingToClose(true)

    if (pillRef.current) {
      pillRef.current.style.transition = 'none'
      pillRef.current.style.willChange = 'transform, opacity'
    }

    const cleanup = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current)
        dragFrameRef.current = null
      }
      dragCleanupRef.current = () => {}
    }

    const updateDragPosition = (clientX: number, clientY: number) => {
      if (!isDraggingToCloseRef.current || !pillRef.current) return
      const offsetX = clientX - dragStartRef.current.x
      const offsetY = clientY - dragStartRef.current.y
      if (Math.hypot(offsetX, offsetY) >= DRAG_THRESHOLD) {
        hasDraggedToCloseRef.current = true
      }

      // 越过相邻胶囊中线时实时重排，让其他胶囊立即让出插入位置
      let visualOffsetY = offsetY
      if (windowId && hasDraggedToCloseRef.current && minimizedCount > 0) {
        const rawIndex = dragStartIndexRef.current + offsetY / MINIMIZED_PILL_GAP
        let targetIndex = dragCurrentIndexRef.current

        while (targetIndex < minimizedCount - 1 && rawIndex > targetIndex + SORT_HYSTERESIS) {
          targetIndex += 1
        }
        while (targetIndex > 0 && rawIndex < targetIndex - SORT_HYSTERESIS) {
          targetIndex -= 1
        }

        if (targetIndex !== dragCurrentIndexRef.current) {
          reorderMinimized(targetIndex)
          dragCurrentIndexRef.current = targetIndex
        }
        visualOffsetY -= (targetIndex - dragStartIndexRef.current) * MINIMIZED_PILL_GAP
      }

      // 直接操作 DOM，避免 React 重新渲染
      const isOverCloseZone = isInsideCloseZone(clientX, clientY)
      if (closeZoneRef.current) {
        closeZoneRef.current.dataset.active = String(isOverCloseZone)
      }
      pillRef.current.style.opacity = isOverCloseZone ? '0.5' : '1'
      pillRef.current.style.transform = `translate(${offsetX}px, ${visualOffsetY}px) ${isOverCloseZone ? 'scale(0.95)' : 'scale(1)'}`
    }

    const handleMouseMove = (e: MouseEvent) => {
      pendingDragPointRef.current = { x: e.clientX, y: e.clientY }
      if (dragFrameRef.current !== null) return

      dragFrameRef.current = requestAnimationFrame(() => {
        dragFrameRef.current = null
        const point = pendingDragPointRef.current
        updateDragPosition(point.x, point.y)
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingToCloseRef.current) return
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current)
        dragFrameRef.current = null
      }
      updateDragPosition(e.clientX, e.clientY)
      const hasDragged = hasDraggedToCloseRef.current
      const shouldClose = Boolean(onClose) && hasDragged && isInsideCloseZone(e.clientX, e.clientY)
      suppressNextClickRef.current = hasDraggedToCloseRef.current
      isDraggingToCloseRef.current = false
      setIsDraggingToClose(false)
      cleanup()
      resetPillStyles()
      if (shouldClose) {
        onClose?.()
      }
    }

    dragCleanupRef.current = cleanup
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [isInsideCloseZone, isMinimized, minimizedCount, onClose, onFocus, registeredMinimizedIndex, reorderMinimized, resetPillStyles, windowId])
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

  // 是否正在拖拽或缩放
  const isInteracting = drag.isDragging || resize.isResizing

  // 最小化时渲染为左侧圆形图标 + 窗口名称
  if (isMinimized) {
    const effectiveMinimizedIndex = windowId ? registeredMinimizedIndex : minimizedIndex
    const pillTop = MINIMIZED_PILL_TOP + effectiveMinimizedIndex * MINIMIZED_PILL_GAP
    return (
      <>
        {/* 拖拽关闭区域 */}
        {isDraggingToClose && onClose && (
          <div
            className="fixed bottom-4 left-4 w-72 max-w-[calc(100vw-2rem)] pointer-events-none"
            style={{ zIndex: zIndex - 1 }}
          >
            <div
              ref={closeZoneRef}
              data-active="false"
              className="glass-panel glow-secondary group flex min-h-20 w-full items-center gap-3 border-secondary/30 bg-bg-dark/80 px-4 py-3 transition-all duration-200 ease-out data-[active=true]:scale-[1.03] data-[active=true]:border-secondary/70 data-[active=true]:bg-secondary/15"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-secondary/30 bg-secondary/10 text-secondary transition-all duration-200 group-data-[active=true]:scale-105 group-data-[active=true]:border-secondary/60 group-data-[active=true]:bg-secondary/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-text-primary">拖到这里关闭</span>
                <span className="text-xs text-text-secondary">松开即可移除窗口</span>
              </div>
            </div>
          </div>
        )}

        {/* 最小化窗口 */}
        <div
          ref={pillRef}
          className="fixed left-3 flex items-center gap-2 py-1.5 pl-1.5 pr-3.5 bg-white/5 backdrop-blur-[10px] border border-primary/30 rounded-[20px] shadow-[0_0_12px_rgba(78,205,196,0.15)] transition-[top,background-color,border-color,box-shadow] duration-150 ease-out select-none hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_16px_rgba(78,205,196,0.25)] cursor-grab active:cursor-grabbing"
          style={{ top: `${pillTop}px`, zIndex }}
          onMouseDown={handleMinimizedMouseDown}
          role="button"
          tabIndex={0}
          aria-label={`恢复窗口：${title || 'Window'}；可上下拖动排序，或拖到底部关闭`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleMinimizeToggle()
            }
          }}
        >
          {/* 恢复窗口按钮 */}
          <div
            onClick={(e) => {
              e.stopPropagation()
              if (suppressNextClickRef.current) {
                suppressNextClickRef.current = false
                return
              }
              handleMinimizeToggle()
            }}
            className="flex items-center gap-2 flex-1"
          >
            {/* 圆形图标 */}
            <div
              className="w-7 h-7 rounded-full border border-primary/40 flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.3), rgba(255, 107, 107, 0.2))' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-primary">
                <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            {/* 窗口名称 */}
            <span className="text-xs text-text-primary whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis">
              {title || 'Window'}
            </span>
          </div>
        </div>
      </>
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
        className="fixed flex flex-col bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl shadow-[0_0_20px_rgba(78,205,196,0.2)] overflow-hidden"
        style={{
          left: pixelPos.x,
          top: pixelPos.y,
          width: pixelWidth,
          height: pixelHeight,
          zIndex,
          transition: isInteracting ? 'none' : 'all 0.2s ease',
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
          className="h-10 min-h-10 flex items-center justify-between px-3 border-b border-white/10 select-none"
          style={{ cursor: drag.isDragging ? 'grabbing' : 'grab' }}
        >
          <span className="text-sm font-medium text-primary overflow-hidden text-ellipsis whitespace-nowrap">
            {title || 'Window'}
          </span>

          <div className="flex gap-1">
            {/* 最小化按钮 */}
            <button
              onClick={handleMinimizeToggle}
              aria-label="最小化窗口"
              className="fw-btn"
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* 最大化按钮 */}
            {onMaximize && (
              <button
                onClick={onMaximize}
                aria-label={isMaximized ? '恢复窗口大小' : '最大化窗口'}
                className="fw-btn"
              >
                {isMaximized ? (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <rect x="3" y="0.5" width="8.5" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="0.5" y="3" width="8.5" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="rgba(0,0,0,0.3)" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
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
                className="fw-btn fw-btn-danger"
              >
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-3">
          {children}
        </div>

        {/* 缩放手柄（右下角） */}
        {!isMaximized && (
          <div
            onMouseDown={(e) => resize.onMouseDown(e, width, height, col, row)}
            className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center opacity-50 transition-opacity duration-200 hover:opacity-100"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-primary">
              <path d="M9 1L1 9M9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
    </>
  )
}
