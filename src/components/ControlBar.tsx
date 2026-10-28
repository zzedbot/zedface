// src/components/ControlBar.tsx

interface ControlBarProps {
  isRecording: boolean
  onMicClick: () => void
  onTextClick: () => void
  onHistoryClick: () => void
}

export function ControlBar({
  isRecording,
  onMicClick,
  onTextClick,
  onHistoryClick,
}: ControlBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="控制栏"
      className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-5 p-5 bg-gradient-to-b from-transparent to-black/40 z-10"
    >
      <button
        onClick={onHistoryClick}
        aria-label="历史记录"
        className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg text-text-secondary transition-all duration-200 ease-out hover:text-primary hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
      >
        ☰
      </button>

      <button
        id="voice-button"
        data-tv-initial="true"
        onClick={onMicClick}
        aria-label={isRecording ? '停止录音' : '开始录音'}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none ${
          isRecording
            ? 'bg-secondary/30 border-2 border-secondary/60 text-secondary shadow-[0_0_25px_rgba(255,107,107,0.3)]'
            : 'bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 text-primary shadow-[0_0_20px_rgba(78,205,196,0.15)]'
        }`}
      >
        🎙
      </button>

      <button
        onClick={onTextClick}
        aria-label="文字输入"
        className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg text-text-secondary transition-all duration-200 ease-out hover:text-primary hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
      >
        ⌨
      </button>
    </div>
  )
}
