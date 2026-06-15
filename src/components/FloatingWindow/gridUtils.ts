// src/components/FloatingWindow/gridUtils.ts

import type { CellSize, GridPosition, GridSize } from './types'

/** 计算单个格位的像素尺寸 */
export function getCellSize(gridCols: number, gridRows: number): CellSize {
  return {
    w: window.innerWidth / gridCols,
    h: window.innerHeight / gridRows,
  }
}

/** 像素值 snap 到最近的格位 */
export function snapToGrid(pixel: number, cellSize: number): number {
  return Math.round(pixel / cellSize)
}

/** 格位坐标 → 像素坐标 */
export function gridToPixel(col: number, row: number, cellSize: CellSize): { x: number; y: number } {
  return {
    x: col * cellSize.w,
    y: row * cellSize.h,
  }
}

/** 约束格位位置，确保窗口不超出视口 */
export function clampGridPos(
  col: number,
  row: number,
  width: number,
  height: number,
  gridCols: number,
  gridRows: number,
): GridPosition {
  const maxCol = Math.max(0, gridCols - width)
  const maxRow = Math.max(0, gridRows - height)
  return {
    col: Math.max(0, Math.min(col, maxCol)),
    row: Math.max(0, Math.min(row, maxRow)),
  }
}

/** 约束格位尺寸，确保在 min/max 范围内且不超出视口 */
export function clampGridSize(
  width: number,
  height: number,
  col: number,
  row: number,
  minWidth: number,
  minHeight: number,
  maxWidth: number,
  maxHeight: number,
  gridCols: number,
  gridRows: number,
): GridSize {
  // 约束在 min/max 范围内
  let w = Math.max(minWidth, Math.min(width, maxWidth))
  let h = Math.max(minHeight, Math.min(height, maxHeight))

  // 约束不超出视口右边界和下边界
  w = Math.min(w, gridCols - col)
  h = Math.min(h, gridRows - row)

  // 再次确保不小于最小值
  w = Math.max(minWidth, w)
  h = Math.max(minHeight, h)

  return { width: w, height: h }
}
