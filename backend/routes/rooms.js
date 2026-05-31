import { Router } from 'express';
import Room from '../models/Room.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/rooms  — list all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().sort('number');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rooms/available/:category  — available rooms (pass 'all' for all categories)
router.get('/available/:category', async (req, res) => {
  try {
    const filter = { status: 'available' };
    if (req.params.category !== 'all') {
      filter.category = parseInt(req.params.category);
    }
    const rooms = await Room.find(filter).sort('number');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin only: update room details
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
