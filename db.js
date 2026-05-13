const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '52.8.221.68',
  user: process.env.DB_USER || 'db_user',
  password: process.env.DB_PASSWORD || 'QWFsausb4163',
  database: process.env.DB_NAME || 'fullstack_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✓ MySQL connection successful');
    connection.release();
  })
  .catch(err => {
    console.error('✗ MySQL connection failed:', err.message);
  });

module.exports = pool;
