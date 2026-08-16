require('dotenv').config();
const express = require('express');
const pool = require('./config/db')
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

//Tests database connection and starts server
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Database connected:', result.rows[0].now);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});