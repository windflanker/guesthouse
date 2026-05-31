import { Router } from 'express';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import { requireAuth } from '../middleware/auth.js';
import {
  smsApproved, smsRejected, smsCheckedIn, smsCheckedOut, smsCancelled,
} from '../services/sms.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────

// POST /api/bookings  — guest submits a new request
router.post('/', async (req, res) => {
  try {
    const { officer, category, checkin, checkout } = req.body;
    if (!officer?.name || !officer?.rank || !officer?.mobile || !category || !checkin || !checkout)
      return res.status(400).json({ message: 'Missing required fields' });
    const booking = new Booking({ officer, category, checkin, checkout });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin (protected) ──────────────────────────────────────────────────────────

// GET /api/bookings
router.get('/', requireAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.category) filter.category = parseInt(req.query.category);
    const bookings = await Booking.find(filter)
      .populate('room', 'number name category')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/approve  — approve + assign room
router.patch('/:id/approve', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ message: 'roomId required' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'Pending')
      return res.status(400).json({ message: 'Only pending bookings can be approved' });

    const room = await Room.findById(roomId);
    if (!room) return res.status(400).json({ message: 'Room not found' });

    booking.status = 'Approved';
    booking.room   = room._id;
    await booking.save();

    room.status         = 'pending';
    room.currentGuest   = booking.officer.name;
    room.currentBooking = booking._id;
    await room.save();

    await booking.populate('room', 'number name category');
    await smsApproved(booking).catch(console.error);

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/reject
router.patch('/:id/reject', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'Pending')
      return res.status(400).json({ message: 'Only pending bookings can be rejected' });

    booking.status = 'Rejected';
    await booking.save();
    await smsRejected(booking).catch(console.error);
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/checkin
router.patch('/:id/checkin', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'Approved')
      return res.status(400).json({ message: 'Only approved bookings can be checked in' });

    booking.status = 'Checked In';
    await booking.save();

    if (booking.room) {
      await Room.findByIdAndUpdate(booking.room._id, { status: 'occupied' });
    }

    await smsCheckedIn(booking).catch(console.error);
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/checkout
router.patch('/:id/checkout', requireAuth, async (req, res) => {
  try {
    const { actualCheckout, notes } = req.body;
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'Checked In')
      return res.status(400).json({ message: 'Only checked-in bookings can be checked out' });

    booking.status        = 'Checked Out';
    booking.actualCheckout = actualCheckout || booking.checkout;
    if (notes) booking.notes = notes;
    await booking.save();

    if (booking.room) {
      await Room.findByIdAndUpdate(booking.room._id, {
        status: 'available', currentGuest: null, currentBooking: null,
      });
    }

    await smsCheckedOut(booking).catch(console.error);
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/cancel  — admin cancels at any stage
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { cancelReason } = req.body;
    if (!cancelReason) return res.status(400).json({ message: 'cancelReason required' });

    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (['Checked Out', 'Cancelled', 'Rejected'].includes(booking.status))
      return res.status(400).json({ message: 'Cannot cancel a closed booking' });

    booking.status       = 'Cancelled';
    booking.cancelReason = cancelReason;
    await booking.save();

    if (booking.room) {
      await Room.findByIdAndUpdate(booking.room._id, {
        status: 'available', currentGuest: null, currentBooking: null,
      });
    }

    await smsCancelled(booking).catch(console.error);
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
