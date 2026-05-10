import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { config } from './config';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({
    limit:'10mb'
}));
app.use(express.urlencoded({ extended: true }));


// request logger in dev 

if (config.isDev){
    app.use((req, _res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// routes

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'trezo-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// 404 handler
app.use((_req, res)=> {
    res.status(404).json({
        error: 'Route not found'
    });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({
        error: 'Internal server error'
    });
});

// TODO: Mount routes here later
// app.use('/api/treasury', treasuryRoutes);
// app.use('/api/invoices', invoiceRoutes);
// etc.

const server = app.listen(config.port, () =>{
    console.log(`\n 🚀  Treszo AI Backend running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Frontend: ${config.frontendUrl}\n`);

    try {
        console.log('✅ Background jobs started\n')
    } catch (err){
        console.warn('⚠️ Background jobs failed to start: ', err instanceof Error ? err.message: err);
    }
});
