// src/components/LogDisplay.tsx

import { useState, useEffect } from 'react';
import { logger } from '../utils/Logger';

export function LogDisplay() {
  const [logs, setLogs] = useState(logger.getLogs());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = logger.subscribe(() => {
      setLogs(logger.getLogs());
    });
    return unsubscribe;
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '8px 16px',
          background: 'rgba(78, 205, 196, 0.2)',
          border: '1px solid rgba(78, 205, 196, 0.4)',
          borderRadius: '4px',
          color: '#4ecdc4',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        显示日志
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '800px',
        height: '80vh',
        background: 'rgba(0, 0, 0, 0.9)',
        border: '1px solid rgba(78, 205, 196, 0.4)',
        borderRadius: '4px',
        padding: '10px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ color: '#4ecdc4', fontSize: '14px' }}>调试日志</span>
        <div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(logs);
              alert('日志已复制到剪贴板');
            }}
            style={{
              padding: '4px 8px',
              background: 'rgba(78, 205, 196, 0.2)',
              border: '1px solid rgba(78, 205, 196, 0.4)',
              borderRadius: '4px',
              color: '#4ecdc4',
              fontSize: '11px',
              cursor: 'pointer',
              marginRight: '5px',
            }}
          >
            复制全部
          </button>
          <button
            onClick={() => logger.clear()}
            style={{
              padding: '4px 8px',
              background: 'rgba(255, 107, 107, 0.2)',
              border: '1px solid rgba(255, 107, 107, 0.4)',
              borderRadius: '4px',
              color: '#ff6b6b',
              fontSize: '11px',
              cursor: 'pointer',
              marginRight: '5px',
            }}
          >
            清空
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: '#888',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            隐藏
          </button>
        </div>
      </div>
      <textarea
        value={logs}
        readOnly
        style={{
          flex: 1,
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(78, 205, 196, 0.2)',
          borderRadius: '4px',
          padding: '8px',
          color: '#4ecdc4',
          fontSize: '11px',
          fontFamily: 'monospace',
          resize: 'none',
          overflowY: 'auto',
        }}
      />
    </div>
  );
}
