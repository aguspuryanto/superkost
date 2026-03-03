import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { initSocket } from './src/server/socket.ts';
import authRoutes from './src/server/routes/auth.ts';
import kostRoutes from './src/server/routes/kosts.ts';
import roomRoutes from './src/server/routes/rooms.ts';
import bookingRoutes from './src/server/routes/bookings.ts';
import tenantRoutes from './src/server/routes/tenants.ts';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = 3000;

  // Initialize Socket.IO
  initSocket(httpServer);

  app.use(cors());
  app.use(cookieParser());
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/kosts', kostRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/tenants', tenantRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving would go here
    // app.use(express.static('dist'));
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
