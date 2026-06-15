// src/hooks/useWindowManager.ts

import { useState, useCallback } from 'react'

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

  /** 打开/创建窗口 */
  const openWindow = useCallback((id: string, options: OpenWindowOptions = {}) => {
    setWindows((prev) => {
      const next = new Map(prev)
      next.set(id, {
        id,
        title: options.title ?? 'Window',
        col: options.col ?? 1,
        row: options.row ?? 1,
        width: options.width ?? 4,
        height: options.height ?? 3,
        isOpen: true,
        isMinimized: false,
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

  return {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    moveWindow,
    resizeWindow,
    setWindowContent,
  }
}
