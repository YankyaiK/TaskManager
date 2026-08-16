const bcrypt = require('bcrypt');
const pool = require('../config/db');

const SALT_ROUNDS = 10;

async function register(req, res) {
  const { first_name, last_name, username, email, password } = req.body;

  // Basic validation
  if (!first_name || !last_name || !username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check for existing username/email
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already in use' });
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert the new user
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, username, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, username, email`,
      [first_name, last_name, username, email, password_hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { register };