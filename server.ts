import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import catalogRoutes from './server/routes/catalog.ts';
import quizRoutes from './server/routes/quiz.ts';
import aiRoutes from './server/routes/ai.ts';
import { adminAuth } from './server/lib/firebaseAdmin.ts';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3002;

  // Security headers & JSON parsing
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use(express.json({ limit: '1mb' }));

  // Socket.IO attached to the same HTTP server on port 3000
  const io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('Unauthorized socket connection'));
    }
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      socket.data.uid = decoded.uid;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.data.uid as string;
    socket.join(`user:${uid}`);
    socket.join('community');

    socket.on('community:post_created', (payload) => {
      socket.to('community').emit('community:post_created', payload);
    });

    socket.on('community:comment_created', (payload) => {
      socket.to('community').emit('community:comment_created', payload);
    });

    socket.on('notification:dispatch', (payload: { targetUid?: string; title?: string; message?: string; type?: string }) => {
      if (payload?.targetUid) {
        io.to(`user:${payload.targetUid}`).emit('notification:new', {
          title: payload.title,
          message: payload.message,
          type: payload.type || 'system',
          createdAt: new Date().toISOString(),
        });
      }
    });

    socket.on('application:status_changed', (payload: { applicantUid?: string; jobTitle?: string; status?: string }) => {
      if (payload?.applicantUid) {
        io.to(`user:${payload.applicantUid}`).emit('application:updated', payload);
      }
    });
  });

  // API v1 Routes
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'hirepath-api',
      timestamp: new Date().toISOString(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.use('/api/v1', catalogRoutes);
  app.use('/api/v1/quizzes', quizRoutes);
  app.use('/api/v1/ai', aiRoutes);

  // Vite dev middleware or production static assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`HirePath server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
