import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { seedDatabase } from './server/seed.js';
import { authRouter } from './server/routes/auth.js';
import { examsRouter } from './server/routes/exams.js';
import { testsRouter } from './server/routes/tests.js';
import { contentRouter } from './server/routes/content.js';
import { paymentsRouter } from './server/routes/payments.js';
import { adminRouter } from './server/routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    product: 'CYBEROSH PARIKSHA',
    timestamp: new Date().toISOString()
  });
});

// API Routes (v1)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/exams', examsRouter);
app.use('/api/v1/tests', testsRouter);
app.use('/api/v1', testsRouter); // For /attempts routes
app.use('/api/v1', contentRouter); // For /materials, /papers, /daily-quiz, /current-affairs, /bookmarks
app.use('/api/v1', paymentsRouter); // For /plans, /coupons, /payments
app.use('/api/v1/admin', adminRouter);

// Initialize & Seed Database
try {
  seedDatabase();
} catch (err) {
  console.error('[CYBEROSH PARIKSHA] Database initialization notice:', err);
}

// Development vs Production Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

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
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[CYBEROSH PARIKSHA] Serving static production bundle from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  CYBEROSH PARIKSHA EDTECH PLATFORM RUNNING`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Mode: ${isProd ? 'Production' : 'Development'}`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('[CYBEROSH PARIKSHA] Failed to start server:', err);
});
