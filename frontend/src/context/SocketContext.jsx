import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let newSocket = null;
    
    if (token) {
      // Establish Socket connection pointing to the backend port 5000
      newSocket = io('http://localhost:5000', {
        transports: ['websocket'],
        upgrade: false
      });
      
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        console.log('Socket.IO connection established with backend.');
      });
    }

    // Cleanup connection on token change or component unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
        console.log('Socket.IO connection disconnected.');
      }
      setSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
