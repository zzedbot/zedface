// src/components/FloatingWindow/useResize.ts

import { useState, useRef, useCallback, useEffect } from 'react'
import type { CellSize } from './types'
import { snapToGrid, clampGridSize } from './gridUtils'

interface UseResizeOptions {
  cellSize: CellSize
  gridCols: number
  gridRows: number
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  onSizeChange: (width: number, height: number) => void
}

interface ResizeState {
  isResizing: boolean
  width: number
  height: number
}

export function useResize(options: UseResizeOptions) {
  const {
    cellSize,
    gridCols,
    gridRows,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    onSizeChange,
  } = options

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    width: 0,
    height: 0,
  })

  // 使用 ref 避免闭包陈旧问题
  const resizeRef = useRef({
    isResizing: false,
    startMouseX: 0,
    startMouseY: 0,
    startWidth: 0,
    startHeight: 0,
    startCol: 0,
    startRow: 0,
    currentWidth: 0,
    currentHeight: 0,
  })

  // 同步 currentWidth/currentHeight
  useEffect(() => {
    resizeRef.current.currentWidth = resizeState.width
    resizeRef.current.currentHeight = resizeState.height
  }, [resizeState.width, resizeState.height])

  const onMouseDown = useCallback(
    (
      e: React.MouseEvent,
      currentWidth: number,
      currentHeight: number,
      currentCol: number,
      currentRow: number,
    ) => {
      // 只响应左键
      if (e.button !== 0) return

      e.preventDefault()
      e.stopPropagation()

      resizeRef.current = {
        isResizing: true,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startWidth: currentWidth,
        startHeight: currentHeight,
        startCol: currentCol,
        startRow: currentRow,
        currentWidth,
        currentHeight,
      }

      setResizeState({
        isResizing: true,
        width: currentWidth,
        height: currentHeight,
      })
    },
    [],
  )

  useEffect(() => {
    // 事件监听器始终注册，由内部 isResizing 判断是否响应
    const onMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current.isResizing) return

      // 首次进入缩放状态时设置 cursor
      if (document.body.style.cursor !== 'nwse-resize') {
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'nwse-resize'
      }

      const deltaX = e.clientX - resizeRef.current.startMouseX
      const deltaY = e.clientY - resizeRef.current.startMouseY

      // 像素偏移 → 格位偏移
      const deltaWidth = snapToGrid(deltaX, cellSize.w)
      const deltaHeight = snapToGrid(deltaY, cellSize.h)

      const newWidth = resizeRef.current.startWidth + deltaWidth
      const newHeight = resizeRef.current.startHeight + deltaHeight

      // 约束尺寸
      const clamped = clampGridSize(
        newWidth,
        newHeight,
        resizeRef.current.startCol,
        resizeRef.current.startRow,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        gridCols,
        gridRows,
      )

      // 更新 ref
      resizeRef.current.currentWidth = clamped.width
      resizeRef.current.currentHeight = clamped.height

      setResizeState({
        isResizing: true,
        width: clamped.width,
        height: clamped.height,
      })
    }

    const onMouseUp = () => {
      if (!resizeRef.current.isResizing) return

      resizeRef.current.isResizing = false

      // 使用 ref 中的最终尺寸（比 setState 回调更可靠）
      const finalWidth = resizeRef.current.currentWidth
      const finalHeight = resizeRef.current.currentHeight

      onSizeChange(finalWidth, finalHeight)

      setResizeState({
        isResizing: false,
        width: finalWidth,
        height: finalHeight,
      })
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [
    cellSize.w,
    cellSize.h,
    gridCols,
    gridRows,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    onSizeChange,
  ])

  return {
    isResizing: resizeState.isResizing,
    width: resizeState.width,
    height: resizeState.height,
    onMouseDown,
  }
}
