const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// 🔧 REPLACE THESE WITH YOUR AWS RDS MYSQL CREDENTIALS
// ============================================================
const dbConfig = {
  host: process.env.DB_HOST || 'YOUR_RDS_ENDPOINT',         // e.g. mydb.abc123.us-east-1.rds.amazonaws.com
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'YOUR_DB_USERNAME',           // e.g. admin
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',   // e.g. MySecurePassword123
  database: process.env.DB_NAME || 'YOUR_DB_NAME',           // e.g. appdb
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // Set to true in production with proper cert
  }
};
// ============================================================

let pool;

async function initDB() {
  pool = mysql.createPool(dbConfig);

  // Create table if not exists
  const conn = await pool.getConnection();
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      role VARCHAR(50) DEFAULT 'User',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  conn.release();
  console.log('✅ Database connected & table initialized');
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// GET all users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create user
app.post('/api/users', async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
      [name, email, role || 'User']
    );
    const [newUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newUser[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update user
app.put('/api/users/:id', async (req, res) => {
  const { name, email, role } = req.body;
  try {
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [name, email, role, req.params.id]
    );
    const [updated] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE user
app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
}).catch(err => {
  console.error('❌ Failed to connect to DB:', err.message);
  process.exit(1);
});
