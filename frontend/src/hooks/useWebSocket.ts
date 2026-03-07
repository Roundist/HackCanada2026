import { useCallback, useRef } from "react";
import { WSMessage } from "../types";

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(
    (sessionId: string) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(
        `${protocol}://${window.location.host}/ws/${sessionId}`
      );

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

      wsRef.current = ws;
    },
    [onMessage]
  );

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { connect, disconnect };
}
