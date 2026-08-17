require('dotenv').config();
const pool = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 3000;

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