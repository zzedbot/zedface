import { useEffect, useRef, useState, useCallback } from 'react';
import type { ZedState, FluidParams } from '../types';

interface ControlMessage {
  action: string;
  state?: ZedState;
  param?: string;
  value?: any;
  params?: Partial<FluidParams>;
  preset?: string;
  type?: 'text' | 'emoji' | 'image' | 'shape';
  content?: string;
  options?: any;
  currentState?: {
    state: ZedState;
    params: Partial<FluidParams>;
  };
}

interface UseControlSocketOptions {
  url?: string;
  token?: string;
  onStateChange?: (state: ZedState) => void;
  onParamsChange?: (params: Partial<FluidParams>) => void;
  onShow?: (type: 'text' | 'emoji' | 'image' | 'shape', content: string, options?: any) => void;
  onShowEnd?: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 10
const BASE_RECONNECT_DELAY_MS = 3000

export function useControlSocket({
  url = 'ws://localhost:3001',
  token = import.meta.env.VITE_WS_TOKEN || '',
  onStateChange,
  onParamsChange,
  onShow,
  onShowEnd,
}: UseControlSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);

  // 用 ref 保存回调，避免依赖数组导致反复重连
  const onStateChangeRef = useRef(onStateChange);
  const onParamsChangeRef = useRef(onParamsChange);
  const onShowRef = useRef(onShow);
  const onShowEndRef = useRef(onShowEnd);

  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);
  useEffect(() => { onParamsChangeRef.current = onParamsChange; }, [onParamsChange]);
  useEffect(() => { onShowRef.current = onShow; }, [onShow]);
  useEffect(() => { onShowEndRef.current = onShowEnd; }, [onShowEnd]);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[ControlSocket] Connected to control server');
        // 发送认证消息
        if (token) {
          ws.send(JSON.stringify({ action: 'auth', token }));
        }
        setConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: ControlMessage = JSON.parse(event.data);
          console.log('[ControlSocket] Received:', message);

          switch (message.action) {
            case 'init':
              if (message.currentState) {
                onStateChangeRef.current?.(message.currentState.state);
                onParamsChangeRef.current?.(message.currentState.params);
              }
              break;
            case 'setState':
              if (message.state) {
                onStateChangeRef.current?.(message.state);
              }
              break;
            case 'setParam':
              if (message.param && message.value !== undefined) {
                onParamsChangeRef.current?.({ [message.param]: message.value });
              }
              break;
            case 'setParams':
              if (message.params) {
                onParamsChangeRef.current?.(message.params);
              }
              break;
            case 'applyPreset':
              break;
            case 'show':
              if (message.type && message.content) {
                onShowRef.current?.(message.type, message.content, message.options);
              }
              break;
            case 'showEnd':
              onShowEndRef.current?.();
              break;
          }
        } catch (error) {
          console.error('[ControlSocket] Failed to parse message:', error);
        }
      };

      ws.onclose = () => {
        console.log('[ControlSocket] Disconnected');
        setConnected(false);

        // 指数退避重连，最大次数限制
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;
          console.log(`[ControlSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.warn('[ControlSocket] Max reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('[ControlSocket] Error:', error);
      };
    } catch (error) {
      console.error('[ControlSocket] Failed to connect:', error);
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current);
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    }
  }, [url, token]);

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
      reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // 阻止自动重连
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    },
  };
}
