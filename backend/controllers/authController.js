const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { rows } = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, me };
