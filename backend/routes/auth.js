import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password required' });

  const admin = await Admin.findOne({ username });
  if (!admin || !(await admin.comparePassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: admin._id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, username: admin.username });
});

export default router;
