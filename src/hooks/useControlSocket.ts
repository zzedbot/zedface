import { useEffect, useRef, useState, useCallback } from 'react';
import type { ZedState } from '../types';
import type { FluidParams } from '../components/ControlPanel';

interface ControlMessage {
  action: string;
  state?: ZedState;
  param?: string;
  value?: any;
  params?: Partial<FluidParams>;
  preset?: string;
}

interface UseControlSocketOptions {
  url?: string;
  onStateChange?: (state: ZedState) => void;
  onParamsChange?: (params: Partial<FluidParams>) => void;
}

export function useControlSocket({
  url = 'ws://localhost:3001',
  onStateChange,
  onParamsChange,
}: UseControlSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[ControlSocket] Connected to control server');
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: ControlMessage = JSON.parse(event.data);
          console.log('[ControlSocket] Received:', message);

          switch (message.action) {
            case 'init':
              // 初始化时接收当前状态
              if (message.state) {
                onStateChange?.(message.state.state as ZedState);
                onParamsChange?.(message.state.params);
              }
              break;
            case 'setState':
              if (message.state) {
                onStateChange?.(message.state);
              }
              break;
            case 'setParam':
              if (message.param && message.value !== undefined) {
                onParamsChange?.({ [message.param]: message.value });
              }
              break;
            case 'setParams':
              if (message.params) {
                onParamsChange?.(message.params);
              }
              break;
            case 'applyPreset':
              // 预设场景会通过多个 setParam 消息发送
              break;
          }
        } catch (error) {
          console.error('[ControlSocket] Failed to parse message:', error);
        }
      };

      ws.onclose = () => {
        console.log('[ControlSocket] Disconnected');
        setConnected(false);
        // 自动重连
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[ControlSocket] Attempting to reconnect...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('[ControlSocket] Error:', error);
      };
    } catch (error) {
      console.error('[ControlSocket] Failed to connect:', error);
      // 连接失败后尝试重连
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    }
  }, [url, onStateChange, onParamsChange]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connected,
    disconnect: () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    },
  };
}
