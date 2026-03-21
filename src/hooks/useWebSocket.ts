import { useEffect, useState } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('hook');

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: string | null;
  sendMessage: (message: string) => void;
}

export default function useWebSocket(url: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage] = useState<string | null>(null);
  const [socket] = useState<WebSocket | null>(null);

  useEffect(() => {
    log.info('WebSocket connection to', { url });
    setIsConnected(true);

    return () => {
      if (socket) {
        socket.close();
      }
      setIsConnected(false);
    };
  }, [url, socket]);

  const sendMessage = (message: string) => {
    if (socket && isConnected) {
      socket.send(message);
    } else {
      log.info('WebSocket not connected', { message });
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}