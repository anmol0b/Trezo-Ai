import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { PublicKey } from '@solana/web3.js';
import { config } from './config';
import { invoicesRouter } from './routes/invoices';
import { treasuryRouter } from './routes/treasury';
import { proposalsRouter } from './routes/proposals';
import { fiatRouter } from './routes/fiat';
import { auditRouter } from './routes/audit';
import { startYieldPoller, stopYieldPoller } from './jobs/yield-poller';
import { startOracleWatcher, stopOracleWatcher } from './jobs/oracle-watcher';
import { startStealthEventIndexer, stopStealthEventIndexer } from './services/sol_rpc';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.isDev) {
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'trezo-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// Routes
app.use('/api/invoices', invoicesRouter);
app.use('/api/treasury', treasuryRouter);
app.use('/api/proposals', proposalsRouter);
app.use('/api/fiat', fiatRouter);
app.use('/api/audit', auditRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(config.port, () => {
  console.log(`\n🚀 Trezo AI Backend running on http://localhost:${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Frontend:    ${config.frontendUrl}\n`);

  try {
    startYieldPoller();
    startOracleWatcher();
    startStealthEventIndexer(new PublicKey(config.solana.programId));
    console.log('✅ Background jobs started\n');
  } catch (err) {
    console.warn('⚠️  Background jobs failed to start:', err instanceof Error ? err.message : err);
    console.warn('   Jobs will start once program is deployed\n');
  }
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down...`);
  stopYieldPoller();
  stopOracleWatcher();
  stopStealthEventIndexer();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));