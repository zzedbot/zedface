const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

type Direction = 'left' | 'right' | 'up' | 'down'

function visibleFocusableElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(element => {
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
  })
}

function scoreCandidate(from: DOMRect, to: DOMRect, direction: Direction): number | null {
  const fromX = from.left + from.width / 2
  const fromY = from.top + from.height / 2
  const toX = to.left + to.width / 2
  const toY = to.top + to.height / 2
  const dx = toX - fromX
  const dy = toY - fromY

  if ((direction === 'left' && dx >= -1) || (direction === 'right' && dx <= 1) ||
      (direction === 'up' && dy >= -1) || (direction === 'down' && dy <= 1)) {
    return null
  }

  const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy)
  const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx)
  return primary + secondary * 2.5
}

function moveFocus(direction: Direction) {
  const candidates = visibleFocusableElements()
  if (candidates.length === 0) return

  const current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (!current || !candidates.includes(current)) {
    (document.querySelector<HTMLElement>('[data-tv-initial="true"]') ?? candidates[0]).focus()
    return
  }

  const from = current.getBoundingClientRect()
  let best: HTMLElement | null = null
  let bestScore = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    if (candidate === current) continue
    const score = scoreCandidate(from, candidate.getBoundingClientRect(), direction)
    if (score !== null && score < bestScore) {
      best = candidate
      bestScore = score
    }
  }
  best?.focus()
}

export function installTvNavigation() {
  document.documentElement.classList.toggle('android-tv', Boolean(window.ZedFaceAndroid))

  window.addEventListener('keydown', event => {
    const directions: Record<string, Direction> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
    }
    const direction = directions[event.key]
    if (!direction) return
    event.preventDefault()
    moveFocus(direction)
  })

  window.setTimeout(() => {
    document.querySelector<HTMLElement>('[data-tv-initial="true"]')?.focus()
  }, 250)
}
