// src/hooks/useWindowManager.ts

import { useState, useCallback, useRef } from 'react'

/** 窗口内容类型 */
export type WindowContentType = 'markdown' | 'html' | 'component' | 'text'

/** 窗口内容 */
export interface WindowContent {
  type: WindowContentType
  body: string
}

/** 窗口状态 */
export interface WindowState {
  id: string
  title: string
  col: number
  row: number
  width: number
  height: number
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  // 最大化前保存的位置和大小（用于恢复）
  prevCol: number
  prevRow: number
  prevWidth: number
  prevHeight: number
  content: WindowContent | null
}

/** 打开窗口的选项 */
export interface OpenWindowOptions {
  col?: number
  row?: number
  width?: number
  height?: number
  title?: string
}

export function useWindowManager() {
  const [windows, setWindows] = useState<Map<string, WindowState>>(new Map())
  const nextZIndexRef = useRef(50) // 起始 z-index，与 FloatingWindow 基础层级一致

  /** 打开/创建窗口 */
  const openWindow = useCallback((id: string, options: OpenWindowOptions = {}) => {
    const col = options.col ?? 1
    const row = options.row ?? 1
    const width = options.width ?? 4
    const height = options.height ?? 3
    const zIndex = nextZIndexRef.current++
    setWindows((prev) => {
      const next = new Map(prev)
      next.set(id, {
        id,
        title: options.title ?? 'Window',
        col,
        row,
        width,
        height,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex,
        prevCol: col,
        prevRow: row,
        prevWidth: width,
        prevHeight: height,
        content: null,
      })
      return next
    })
  }, [])

  /** 关闭窗口 */
  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  /** 最小化/恢复窗口 */
  const minimizeWindow = useCallback((id: string, minimized?: boolean) => {
    setWindows((prev) => {
      const window = prev.get(id)
      if (!window) return prev
      const next = new Map(prev)
      next.set(id, {
        ...window,
        isMinimized: minimized ?? !window.isMinimized,
      })
      return next
    })
  }, [])

  /** 移动窗口 */
  const moveWindow = useCallback((id: string, col: number, row: number) => {
    setWindows((prev) => {
      const window = prev.get(id)
      if (!window) return prev
      const next = new Map(prev)
      next.set(id, { ...window, col, row })
      return next
    })
  }, [])

  /** 调整窗口大小 */
  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) => {
      const window = prev.get(id)
      if (!window) return prev
      const next = new Map(prev)
      next.set(id, { ...window, width, height })
      return next
    })
  }, [])

  /** 设置窗口内容 */
  const setWindowContent = useCallback((id: string, type: WindowContentType, body: string) => {
    setWindows((prev) => {
      const window = prev.get(id)
      if (!window) return prev
      const next = new Map(prev)
      next.set(id, { ...window, content: { type, body } })
      return next
    })
  }, [])

  /** 最大化/恢复窗口 */
  const maximizeWindow = useCallback((id: string, gridCols: number = 12, gridRows: number = 8) => {
    setWindows((prev) => {
      const window = prev.get(id)
      if (!window) return prev
      const next = new Map(prev)
      if (window.isMaximized) {
        // 恢复到之前的位置和大小
        next.set(id, {
          ...window,
          col: window.prevCol,
          row: window.prevRow,
          width: window.prevWidth,
          height: window.prevHeight,
          isMaximized: false,
        })
      } else {
        // 保存当前位置和大小，然后最大化
        next.set(id, {
          ...window,
          prevCol: window.col,
          prevRow: window.row,
          prevWidth: window.width,
          prevHeight: window.height,
          col: 0,
          row: 0,
          width: gridCols,
          height: gridRows,
          isMaximized: true,
        })
      }
      return next
    })
  }, [])

  /** 将窗口置于最前 */
  const focusWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const window = prev.get(id)
      if (!window) return prev
      // 如果已经是最高层级，不需要更新
      const maxZ = Math.max(...Array.from(prev.values()).map((w) => w.zIndex))
      if (window.zIndex >= maxZ) return prev
      const newZIndex = nextZIndexRef.current++
      const next = new Map(prev)
      next.set(id, { ...window, zIndex: newZIndex })
      return next
    })
  }, [])

  return {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
    setWindowContent,
  }
}
