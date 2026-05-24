import { Router } from 'express';
import Room from '../models/Room.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/rooms  — list all rooms (public, for booking form availability)
router.get('/', async (req, res) => {
  const rooms = await Room.find().sort('number');
  res.json(rooms);
});

// GET /api/rooms/available/:category  — available rooms for a category
router.get('/available/:category', async (req, res) => {
  const rooms = await Room.find({
    category: parseInt(req.params.category),
    status: 'available',
  }).sort('number');
  res.json(rooms);
});

// Admin only: update room status directly
router.patch('/:id', requireAuth, async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room);
});

export default router;
