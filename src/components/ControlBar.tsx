// src/components/ControlBar.tsx

interface ControlBarProps {
  isRecording: boolean
  onMicClick: () => void
  onTextClick: () => void
  onHistoryClick: () => void
}

const sideBtnStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  color: '#888',
  transition: 'all 0.2s ease',
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
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        padding: '20px',
        background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.4))',
        zIndex: 10,
      }}
    >
      <button
        onClick={onHistoryClick}
        aria-label="历史记录"
        style={sideBtnStyle}
      >
        ☰
      </button>

      <button
        onClick={onMicClick}
        aria-label={isRecording ? '停止录音' : '开始录音'}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isRecording
            ? 'rgba(255, 107, 107, 0.3)'
            : 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(255, 107, 107, 0.2))',
          border: `2px solid ${isRecording ? 'rgba(255, 107, 107, 0.6)' : 'rgba(78, 205, 196, 0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: isRecording ? '#ff6b6b' : '#4ecdc4',
          boxShadow: isRecording
            ? '0 0 25px rgba(255, 107, 107, 0.3)'
            : '0 0 20px rgba(78, 205, 196, 0.15)',
          transition: 'all 0.2s ease',
        }}
      >
        🎙
      </button>

      <button
        onClick={onTextClick}
        aria-label="文字输入"
        style={sideBtnStyle}
      >
        ⌨
      </button>
    </div>
  )
}
