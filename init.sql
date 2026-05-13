-- Optional SQL initialization script for MySQL in Docker
-- This script is executed when the MySQL container starts for the first time
-- It's already handled by Node.js setup-db.js, but this can be useful for additional setup

-- Create the database (if not exists is handled by docker-compose)
-- CREATE DATABASE IF NOT EXISTS fullstack_db;

-- Use the database
USE fullstack_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT IGNORE INTO users (id, name, email) VALUES
(1, 'John Doe', 'john@example.com'),
(2, 'Jane Smith', 'jane@example.com'),
(3, 'Bob Johnson', 'bob@example.com'),
(4, 'Alice Williams', 'alice@example.com'),
(5, 'Charlie Brown', 'charlie@example.com');

-- Display final status
SELECT 'Database initialization complete!' as Status;
SELECT COUNT(*) as 'Total Users' FROM users;
