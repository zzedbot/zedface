// src/components/FloatingWindow/useDrag.ts

import { useState, useRef, useCallback, useEffect } from 'react'
import type { CellSize } from './types'
import { snapToGrid, clampGridPos } from './gridUtils'

interface UseDragOptions {
  cellSize: CellSize
  gridCols: number
  gridRows: number
  windowWidth: number
  windowHeight: number
  onPositionChange: (col: number, row: number) => void
}

interface DragState {
  isDragging: boolean
  col: number
  row: number
}

export function useDrag(options: UseDragOptions) {
  const { cellSize, gridCols, gridRows, windowWidth, windowHeight, onPositionChange } = options

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    col: 0,
    row: 0,
  })

  // 使用 ref 避免闭包陈旧问题
  const dragRef = useRef({
    isDragging: false,
    startMouseX: 0,
    startMouseY: 0,
    startCol: 0,
    startRow: 0,
    currentCol: 0,
    currentRow: 0,
  })

  // 同步 currentCol/currentRow
  useEffect(() => {
    dragRef.current.currentCol = dragState.col
    dragRef.current.currentRow = dragState.row
  }, [dragState.col, dragState.row])

  const onMouseDown = useCallback(
    (e: React.MouseEvent, currentCol: number, currentRow: number) => {
      // 只响应左键
      if (e.button !== 0) return

      e.preventDefault()

      dragRef.current = {
        isDragging: true,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startCol: currentCol,
        startRow: currentRow,
        currentCol,
        currentRow,
      }

      setDragState({
        isDragging: true,
        col: currentCol,
        row: currentRow,
      })
    },
    [],
  )

  useEffect(() => {
    // 事件监听器始终注册，由内部 isDragging 判断是否响应
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return

      // 首次进入拖拽状态时设置 cursor
      if (document.body.style.cursor !== 'grabbing') {
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'grabbing'
      }

      const deltaX = e.clientX - dragRef.current.startMouseX
      const deltaY = e.clientY - dragRef.current.startMouseY

      // 像素偏移 → 格位偏移
      const deltaCol = snapToGrid(deltaX, cellSize.w)
      const deltaRow = snapToGrid(deltaY, cellSize.h)

      const newCol = dragRef.current.startCol + deltaCol
      const newRow = dragRef.current.startRow + deltaRow

      // 约束在视口内
      const clamped = clampGridPos(
        newCol,
        newRow,
        windowWidth,
        windowHeight,
        gridCols,
        gridRows,
      )

      // 更新 ref（避免频繁 setState）
      dragRef.current.currentCol = clamped.col
      dragRef.current.currentRow = clamped.row

      setDragState({
        isDragging: true,
        col: clamped.col,
        row: clamped.row,
      })
    }

    const onMouseUp = () => {
      if (!dragRef.current.isDragging) return

      dragRef.current.isDragging = false

      // 使用 ref 中的最终位置（比 setState 回调更可靠）
      const finalCol = dragRef.current.currentCol
      const finalRow = dragRef.current.currentRow

      onPositionChange(finalCol, finalRow)

      setDragState({
        isDragging: false,
        col: finalCol,
        row: finalRow,
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
  }, [cellSize.w, cellSize.h, gridCols, gridRows, windowWidth, windowHeight, onPositionChange])

  return {
    isDragging: dragState.isDragging,
    col: dragState.col,
    row: dragState.row,
    onMouseDown,
  }
}
