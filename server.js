const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();
const PORT = process.env.API_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Track server start time
const serverStartTime = new Date();

// Database initialization flag
let dbInitialized = false;

// Initialize database on startup
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create tables if they don't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Check if table is empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    // Insert sample data if table is empty
    if (rows[0].count === 0) {
      await connection.query(`
        INSERT INTO users (name, email) VALUES
        ('John Doe', 'john@example.com'),
        ('Jane Smith', 'jane@example.com'),
        ('Bob Johnson', 'bob@example.com'),
        ('Alice Williams', 'alice@example.com'),
        ('Charlie Brown', 'charlie@example.com')
      `);
      console.log('✓ Sample users inserted');
    }
    
    connection.release();
    dbInitialized = true;
    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('✗ Database initialization error:', error.message);
    // Retry after 5 seconds if Docker is still starting MySQL
    setTimeout(initializeDatabase, 5000);
  }
}

// ============ HEALTH CHECK ENDPOINTS ============

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is Working',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
  });
});

// Database Health Check
app.get('/api/db-health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 as alive');
    connection.release();

    res.status(200).json({
      status: 'success',
      message: 'Database Connected Successfully',
      database: process.env.DB_NAME,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database Connection Failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Combined Status Endpoint
app.get('/api/status', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 as alive');
    connection.release();

    res.status(200).json({
      status: 'success',
      backend: {
        server: 'Backend Server Running',
        status: 'online',
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        startTime: serverStartTime.toISOString(),
      },
      database: {
        status: 'connected',
        name: process.env.DB_NAME,
        host: process.env.DB_HOST,
      },
      api: {
        status: 'working',
        version: '1.0.0',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(200).json({
      status: 'warning',
      backend: {
        server: 'Backend Server Running',
        status: 'online',
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        startTime: serverStartTime.toISOString(),
      },
      database: {
        status: 'disconnected',
        name: process.env.DB_NAME,
        host: process.env.DB_HOST,
        error: error.message,
      },
      api: {
        status: 'working',
        version: '1.0.0',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// ============ SAMPLE DATA ENDPOINTS ============

// Get sample users
app.get('/api/sample-users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Check if users table exists
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
      [process.env.DB_NAME]
    );

    if (tables.length === 0) {
      // Table doesn't exist, return mock data
      return res.status(200).json({
        source: 'mock',
        data: [
          { id: 1, name: 'John Doe', email: 'john@example.com', created_at: new Date().toISOString() },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: new Date().toISOString() },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: new Date().toISOString() },
        ],
        message: 'Sample data (mock - table does not exist)',
      });
    }

    const [users] = await connection.query('SELECT * FROM users LIMIT 10');
    connection.release();

    res.status(200).json({
      source: 'database',
      data: users,
      count: users.length,
    });
  } catch (error) {
    res.status(200).json({
      source: 'mock',
      data: [
        { id: 1, name: 'John Doe', email: 'john@example.com', created_at: new Date().toISOString() },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: new Date().toISOString() },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: new Date().toISOString() },
      ],
      message: 'Sample data (mock - database error)',
      error: error.message,
    });
  }
});

// Get system information
app.get('/api/system-info', (req, res) => {
  const os = require('os');

  res.status(200).json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    server: {
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
      startTime: serverStartTime.toISOString(),
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      uptime: `${Math.floor(os.uptime() / 3600)} hours`,
    },
  });
});

// ============ ROOT ENDPOINT ============

app.get('/', (req, res) => {
  res.json({
    message: 'Full-Stack Application API',
    version: '1.0.0',
    dbInitialized: dbInitialized,
    endpoints: {
      health: '/api/health',
      dbHealth: '/api/db-health',
      status: '/api/status',
      sampleUsers: '/api/sample-users',
      systemInfo: '/api/system-info',
    },
  });
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: err.message,
  });
});

// ============ START SERVER ============

app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════╗
║     Backend Server is Running!         ║
║     API: http://localhost:${PORT}        ║
║     Endpoints: /api/...                ║
╚════════════════════════════════════════╝
  `);
  
  // Initialize database on startup
  await initializeDatabase();
});

module.exports = app;
