import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import invoiceRoutes from './routes/invoices.js';
import analyticsRoutes from './routes/analytics.js';

// ✅ Directly define environment variables (no .env needed)
const MONGODB_URI = "mongodb+srv://admin:db_passwordt@cluster0.qqn6h.mongodb.net/inventory-billing";
const JWT_SECRET = "yourSecretKey";   // if needed inside auth logic
const PORT = 5000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Status
let mongoConnected = false;
let mongoConnectionString = MONGODB_URI || 'Not set';

// MongoDB Connection Function with Retry Logic
async function connectToMongoDB(retryCount = 5) {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set');
    return false;
  }

  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('📡 Connection string:', mongoConnectionString ? 'Set' : 'Not set');

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    mongoConnected = true;
    console.log('✅ Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection attempt failed:', error.message);

    if (retryCount > 0) {
      console.log(`🔄 Retrying in 5 seconds... (${retryCount} attempts remaining)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectToMongoDB(retryCount - 1);
    } else {
      console.error('💥 Failed to connect to MongoDB after all retry attempts');
      return false;
    }
  }
}

// MongoDB Connection Event Handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
  mongoConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  mongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
  mongoConnected = false;
});

// Health Check Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
  });
});

app.get('/api/mongodb-status', (req, res) => {
  res.json({
    connected: mongoConnected,
    connectionString: mongoConnectionString ? 'Set' : 'Not set',
    database: mongoose.connection.db ? mongoose.connection.db.databaseName : 'Unknown',
    host: mongoose.connection.host || 'Unknown',
    port: mongoose.connection.port || 'Unknown',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/analytics', analyticsRoutes);

// Initialize Server
async function startServer() {
  try {
    const mongoSuccess = await connectToMongoDB();

    if (mongoSuccess) {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Health check available at: http://localhost:${PORT}/api/health`);
        console.log(`🔍 MongoDB status at: http://localhost:${PORT}/api/mongodb-status`);
      });
    } else {
      console.error('❌ Failed to start server due to MongoDB connection failure');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Server startup error:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message,
  });
});

// Start the server
startServer();
