import { useEffect, useRef, useState, useCallback } from 'react';
import type { ZedState, FluidParams } from '../types';
import type { WindowContentType } from './useWindowManager';

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
  // 窗口控制字段
  windowId?: string;
  title?: string;
  col?: number;
  row?: number;
  width?: number;
  height?: number;
  minimized?: boolean;
  contentType?: WindowContentType;
}

interface UseControlSocketOptions {
  url?: string;
  token?: string;
  onStateChange?: (state: ZedState) => void;
  onParamsChange?: (params: Partial<FluidParams>) => void;
  onShow?: (type: 'text' | 'emoji' | 'image' | 'shape', content: string, options?: any) => void;
  onShowEnd?: () => void;
  // 窗口控制回调
  onWindowOpen?: (windowId: string, title: string, options: { col?: number; row?: number; width?: number; height?: number }) => void;
  onWindowClose?: (windowId: string) => void;
  onWindowMinimize?: (windowId: string, minimized?: boolean) => void;
  onWindowMove?: (windowId: string, col: number, row: number) => void;
  onWindowResize?: (windowId: string, width: number, height: number) => void;
  onWindowSetContent?: (windowId: string, contentType: WindowContentType, content: string) => void;
}

const MAX_RECONNECT_ATTEMPTS = 10
const BASE_RECONNECT_DELAY_MS = 3000

export function useControlSocket({
  url = 'ws://localhost:3001',
  token = import.meta.env.VITE_WS_TOKEN || 'zedface-control-dev-token',
  onStateChange,
  onParamsChange,
  onShow,
  onShowEnd,
  onWindowOpen,
  onWindowClose,
  onWindowMinimize,
  onWindowMove,
  onWindowResize,
  onWindowSetContent,
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
  const onWindowOpenRef = useRef(onWindowOpen);
  const onWindowCloseRef = useRef(onWindowClose);
  const onWindowMinimizeRef = useRef(onWindowMinimize);
  const onWindowMoveRef = useRef(onWindowMove);
  const onWindowResizeRef = useRef(onWindowResize);
  const onWindowSetContentRef = useRef(onWindowSetContent);

  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);
  useEffect(() => { onParamsChangeRef.current = onParamsChange; }, [onParamsChange]);
  useEffect(() => { onShowRef.current = onShow; }, [onShow]);
  useEffect(() => { onShowEndRef.current = onShowEnd; }, [onShowEnd]);
  useEffect(() => { onWindowOpenRef.current = onWindowOpen; }, [onWindowOpen]);
  useEffect(() => { onWindowCloseRef.current = onWindowClose; }, [onWindowClose]);
  useEffect(() => { onWindowMinimizeRef.current = onWindowMinimize; }, [onWindowMinimize]);
  useEffect(() => { onWindowMoveRef.current = onWindowMove; }, [onWindowMove]);
  useEffect(() => { onWindowResizeRef.current = onWindowResize; }, [onWindowResize]);
  useEffect(() => { onWindowSetContentRef.current = onWindowSetContent; }, [onWindowSetContent]);

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
            // 窗口控制消息
            case 'windowOpen':
              if (message.windowId) {
                onWindowOpenRef.current?.(message.windowId, message.title || 'Window', {
                  col: message.col,
                  row: message.row,
                  width: message.width,
                  height: message.height,
                });
              }
              break;
            case 'windowClose':
              if (message.windowId) {
                onWindowCloseRef.current?.(message.windowId);
              }
              break;
            case 'windowMinimize':
              if (message.windowId) {
                onWindowMinimizeRef.current?.(message.windowId, message.minimized);
              }
              break;
            case 'windowMove':
              if (message.windowId && message.col !== undefined && message.row !== undefined) {
                onWindowMoveRef.current?.(message.windowId, message.col, message.row);
              }
              break;
            case 'windowResize':
              if (message.windowId && message.width !== undefined && message.height !== undefined) {
                onWindowResizeRef.current?.(message.windowId, message.width, message.height);
              }
              break;
            case 'windowSetContent':
              if (message.windowId && message.contentType && message.content !== undefined) {
                onWindowSetContentRef.current?.(message.windowId, message.contentType, message.content);
              }
              break;
          }
        } catch (error) {
          console.error('[ControlSocket] Failed to parse message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[ControlSocket] Disconnected', event.code, event.reason);
        setConnected(false);

        // 认证失败（服务端主动拒绝）不重连
        if (event.code === 4001 || event.code === 4002) {
          console.warn('[ControlSocket] Auth rejected, not reconnecting');
          reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS;
          return;
        }

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
