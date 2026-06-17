import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5000';

export const socket = io(socketUrl, {
  withCredentials: true,
  autoConnect: true,
});
