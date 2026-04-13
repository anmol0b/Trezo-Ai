import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'koshai-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// TODO: Mount routes here later
// app.use('/api/treasury', treasuryRoutes);
// app.use('/api/invoices', invoiceRoutes);
// etc.

app.listen(PORT, () => {
  console.log(`🚀 Koshai Backend running on http://localhost:${PORT}`);
});
