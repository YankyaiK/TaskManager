const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

    if (existing.rows.length > 0) {//reject because user already exists/is in use
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

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT user_id, username, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { register, login };