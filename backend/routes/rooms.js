import { Router } from 'express';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/rooms — list all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().sort('number');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rooms/available/:category?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD
router.get('/available/:category', async (req, res) => {
  try {
    const { checkin, checkout } = req.query;

    let occupiedRoomIds = [];
    if (checkin && checkout) {
      const overlapping = await Booking.find({
        status: { $in: ['Approved', 'Checked In'] },
        checkin: { $lt: checkout },  // existing booking starts before new checkout
        checkout: { $gt: checkin },  // existing booking ends after new checkin
      }).select('room');

      occupiedRoomIds = overlapping
        .filter(b => b.room)
        .map(b => b.room.toString());
    }

    const filter = {};
    if (req.params.category !== 'all') {
      filter.category = parseInt(req.params.category);
    }

    const rooms = await Room.find(filter).sort('number');
    const available = rooms.filter(r => !occupiedRoomIds.includes(r._id.toString()));
    res.json(available);
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
