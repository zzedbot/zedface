// src/hooks/useMinimizedWindows.ts

import { useCallback, useSyncExternalStore } from 'react'

/**
 * 全局最小化窗口注册表
 * 所有窗口通过此 hook 注册/注销自己的最小化状态
 * 自动分配连续的索引（按最小化时间排序）
 */

type MinimizedWindow = {
  id: string
}

// 全局状态（所有实例共享）
let windows: MinimizedWindow[] = []
const listeners: Set<() => void> = new Set()

function notify() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return windows
}

export function useMinimizedWindows(windowId: string) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  // 注册为最小化
  const register = useCallback(() => {
    if (!windows.find((w) => w.id === windowId)) {
      windows = [...windows, { id: windowId }]
      notify()
    }
  }, [windowId])

  // 注销最小化
  const unregister = useCallback(() => {
    if (!windows.some((w) => w.id === windowId)) return
    windows = windows.filter((w) => w.id !== windowId)
    notify()
  }, [windowId])

  // 调整最小化窗口顺序
  const reorder = useCallback((targetIndex: number) => {
    const currentIndex = windows.findIndex((w) => w.id === windowId)
    if (currentIndex === -1) return

    const clampedIndex = Math.max(0, Math.min(Math.round(targetIndex), windows.length - 1))
    if (clampedIndex === currentIndex) return

    const nextWindows = [...windows]
    const [movedWindow] = nextWindows.splice(currentIndex, 1)
    if (!movedWindow) return
    nextWindows.splice(clampedIndex, 0, movedWindow)
    windows = nextWindows
    notify()
  }, [windowId])

  // 获取当前窗口的最小化索引
  const minimizedIndex = snapshot.findIndex((w) => w.id === windowId)

  return {
    minimizedIndex: minimizedIndex === -1 ? 0 : minimizedIndex,
    minimizedCount: snapshot.length,
    register,
    unregister,
    reorder,
  }
}
