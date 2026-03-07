import { useCallback, useRef } from "react";
import { WSMessage } from "../types";

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(false);

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const openSocket = useCallback(
    (sessionId: string) => {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(
        `${protocol}://${window.location.host}/ws/warroom/${sessionId}`
      );

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSMessage;
          onMessage(data);
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        console.error("WebSocket error");
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!shouldReconnectRef.current || sessionIdRef.current !== sessionId) return;
        clearReconnectTimer();
        const attempt = reconnectAttemptRef.current + 1;
        reconnectAttemptRef.current = attempt;
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        reconnectTimerRef.current = window.setTimeout(() => {
          if (!shouldReconnectRef.current || sessionIdRef.current !== sessionId) return;
          openSocket(sessionId);
        }, delayMs);
      };

      wsRef.current = ws;
    },
    [onMessage]
  );

  const connect = useCallback(
    (sessionId: string) => {
      shouldReconnectRef.current = true;
      sessionIdRef.current = sessionId;
      reconnectAttemptRef.current = 0;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close();
      }
      openSocket(sessionId);
    },
    [openSocket]
  );

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    sessionIdRef.current = null;
    reconnectAttemptRef.current = 0;
    clearReconnectTimer();
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { connect, disconnect };
}
