import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, username: admin.username, role: admin.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/create-manager — admin only
router.post('/create-manager', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const exists = await Admin.findOne({ username });
    if (exists)
      return res.status(400).json({ message: 'Username already exists' });

    const manager = new Admin({ username, password, role: 'manager' });
    await manager.save();
    res.status(201).json({ message: 'Manager account created', username, role: 'manager' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
