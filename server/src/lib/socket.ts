import { Server } from 'socket.io';
import http from 'http';

let io: Server | null = null;

export function initSocket(server: http.Server) {
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
    : ['http://localhost:5173', 'https://web.eyeglaze.in'];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin
        if (!origin) {
          return callback(null, true);
        }

        // Check if origin is in client url list
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Allow localhost and 127.0.0.1 with any port
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (isLocalhost) {
          return callback(null, true);
        }

        // Allow mobile emulator loopback
        const isEmulator = /^http:\/\/10\.0\.2\.2(:\d+)?$/.test(origin);
        if (isEmulator) {
          return callback(null, true);
        }

        // Allow all origins in development mode
        if (process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }

        // Otherwise reject
        callback(null, false);
      },
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Join a user-specific room
    socket.on('join_user_room', (userId: string) => {
      if (userId) {
        socket.join(`user-${userId}`);
      }
    });

    // Leave a user-specific room
    socket.on('leave_user_room', (userId: string) => {
      if (userId) {
        socket.leave(`user-${userId}`);
      }
    });
    
    socket.on('disconnect', () => {
      // Quietly handle disconnection
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
