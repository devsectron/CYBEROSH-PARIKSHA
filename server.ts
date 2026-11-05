import { isProd, TRUST_PROXY, paymentMode } from './server/lib/config.js'; // must stay first: loads .env
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';
import { seedDatabase } from './server/seed.js';
import { authRouter } from './server/routes/auth.js';
import { examsRouter } from './server/routes/exams.js';
import { testsRouter, attemptsRouter } from './server/routes/tests.js';
import { contentRouter } from './server/routes/content.js';
import { paymentsRouter } from './server/routes/payments.js';
import { adminRouter } from './server/routes/admin.js';
import { rateLimit } from './server/middleware/rateLimit.js';
import { securityHeaders } from './server/middleware/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

export const app = express();
app.disable('x-powered-by');
if (TRUST_PROXY) app.set('trust proxy', TRUST_PROXY);

// Middleware
app.use(securityHeaders);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Healthcheck endpoint (also verifies the database is reachable)
app.get('/api/health', (_req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({
      status: 'healthy',
      product: 'CYBEROSH PARIKSHA',
      payment_mode: paymentMode,
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
  }
});

// Brute-force / abuse protection on the sensitive endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts. Please wait a few minutes and try again.'
});
const paymentLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30 });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 600 });

app.use('/api/', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/change-password', authLimiter);
app.use('/api/v1/coupons', paymentLimiter);
app.use('/api/v1/create-order', paymentLimiter);
app.use('/api/v1/verify', paymentLimiter);

// API Routes (v1)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/exams', examsRouter);
app.use('/api/v1/tests/attempts', attemptsRouter); // legacy path, kept for older clients
app.use('/api/v1/tests', testsRouter);
app.use('/api/v1/attempts', attemptsRouter);
app.use('/api/v1', contentRouter); // /materials, /papers, /daily-quiz, /current-affairs, /bookmarks
app.use('/api/v1', paymentsRouter); // /plans, /coupons, /create-order, /verify
app.use('/api/v1/admin', adminRouter);

// Unknown API routes must answer in JSON (never the SPA's index.html).
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// Malformed JSON bodies and any uncaught route error.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, message: 'Malformed JSON in request body.' });
    return;
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ success: false, message: 'Request body is too large.' });
    return;
  }
  console.error('[CYBEROSH PARIKSHA] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Unexpected server error.' });
});

// Initialize & seed database
try {
  seedDatabase();
} catch (err) {
  console.error('[CYBEROSH PARIKSHA] Database initialization notice:', err);
}

// Development vs production serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[CYBEROSH PARIKSHA] Vite middleware loaded in development mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { maxAge: '1h', index: false }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[CYBEROSH PARIKSHA] Serving static production bundle from dist.');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  CYBEROSH PARIKSHA EDTECH PLATFORM RUNNING`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Mode: ${isProd ? 'Production' : 'Development'}   Payments: ${paymentMode}`);
    console.log(`====================================================`);
  });

  // Close the SQLite handle cleanly so the WAL is checkpointed on deploys / restarts.
  const shutdown = (signal: string) => {
    console.log(`[CYBEROSH PARIKSHA] ${signal} received, shutting down.`);
    server.close(() => {
      try {
        db.close();
      } catch {
        /* already closed */
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Only boot the listener when run directly, so tests can import `app` without opening a port.
const isMain = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false;
if (isMain) {
  startServer().catch(err => {
    console.error('[CYBEROSH PARIKSHA] Failed to start server:', err);
    process.exit(1);
  });
}
