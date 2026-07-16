import { io } from 'socket.io-client';

const getSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) return envUrl;

  const apiEnvUrl = import.meta.env.VITE_API_URL;
  if (apiEnvUrl) {
    const normalized = apiEnvUrl.replace(/\/+$/, '');
    if (normalized.endsWith('/api')) {
      return normalized.slice(0, -4);
    }
    return normalized;
  }

  // Resolve dynamically based on window location to prevent loopback mismatch
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:5000`;
};

const socketUrl = getSocketUrl();

// console.log('🔌 Connecting to socket server at:', socketUrl);

export const socket = io(socketUrl, {
  withCredentials: true,
  autoConnect: false,
  transports: ['websocket', 'polling'], // Prioritize websocket transport
});

socket.on('connect', () => {
  // console.log('⚡ Socket connected successfully:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.warn('🔌 Socket disconnected:', reason);
});
