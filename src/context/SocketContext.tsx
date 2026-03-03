import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext.tsx';

// Use any for Socket to avoid type issues
type SocketType = any;

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface SocketContextType {
  socket: SocketType | null;
  notifications: Notification[];
  markAsRead: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      // In production, use the actual server URL
      const newSocket = io(window.location.origin);
      
      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        newSocket.emit('join_room', user.id);
      });

      newSocket.on('notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        // Optional: Show toast
        alert(`New Notification: ${notification.title}`);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    // TODO: Call API to mark as read in DB
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, markAsRead }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
