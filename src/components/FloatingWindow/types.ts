// src/components/FloatingWindow/types.ts

/** 格位坐标 */
export interface GridPosition {
  col: number
  row: number
}

/** 格位尺寸（占用几个格位） */
export interface GridSize {
  width: number
  height: number
}

/** 单个格位的像素尺寸 */
export interface CellSize {
  w: number
  h: number
}

/** FloatingWindow 组件 Props */
export interface FloatingWindowProps {
  /** 窗口标题 */
  title?: string
  /** 窗口内容 */
  children: React.ReactNode
  /** 是否打开 */
  isOpen?: boolean
  /** 是否最小化（受控） */
  isMinimized?: boolean
  /** 是否最大化（受控） */
  isMaximized?: boolean
  /** 最小化时的堆叠索引（用于垂直排列） */
  minimizedIndex?: number
  /** 窗口层级 */
  zIndex?: number

  // 网格配置
  /** 列数，默认 12 */
  gridCols?: number
  /** 行数，默认 8 */
  gridRows?: number

  // 初始位置（格位单位）
  /** 初始列位置，默认 1 */
  initialCol?: number
  /** 初始行位置，默认 1 */
  initialRow?: number

  // 初始大小（格位单位）
  /** 初始宽度（占用几列），默认 4 */
  initialWidth?: number
  /** 初始高度（占用几行），默认 3 */
  initialHeight?: number

  // 大小限制（格位单位）
  /** 最小宽度，默认 2 */
  minWidth?: number
  /** 最小高度，默认 2 */
  minHeight?: number
  /** 最大宽度，默认 gridCols */
  maxWidth?: number
  /** 最大高度，默认 gridRows */
  maxHeight?: number

  // 回调
  /** 关闭回调 */
  onClose?: () => void
  /** 最小化回调 */
  onMinimize?: () => void
  /** 最大化回调 */
  onMaximize?: () => void
  /** 聚焦（置于最前）回调 */
  onFocus?: () => void
  /** 位置变化回调 */
  onPositionChange?: (col: number, row: number) => void
  /** 大小变化回调 */
  onSizeChange?: (width: number, height: number) => void
}
