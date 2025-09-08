import { useEffect, useState } from 'react';

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
    // TODO: WebSocket 연결 구현
    console.log('WebSocket connection to:', url);
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
      console.log('WebSocket not connected, message:', message);
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}