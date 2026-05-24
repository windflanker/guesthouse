const router = require('express').Router();
const auth = require('../controllers/authController');
const bookings = require('../controllers/bookingsController');
const rooms = require('../controllers/roomsController');
const { requireAdmin } = require('../middleware/auth');

// Auth
router.post('/auth/login', auth.login);
router.get('/auth/me', requireAdmin, auth.me);

// Dashboard
router.get('/dashboard', requireAdmin, bookings.getDashboard);

// Rooms
router.get('/rooms', requireAdmin, rooms.getRooms);

// Bookings — public create, admin everything else
router.post('/bookings',                  bookings.createBooking);
router.get('/bookings',     requireAdmin, bookings.listBookings);
router.get('/bookings/:id', requireAdmin, bookings.getBooking);

// Workflow actions (admin only)
router.patch('/bookings/:id/approve',  requireAdmin, bookings.approveBooking);
router.patch('/bookings/:id/reject',   requireAdmin, bookings.rejectBooking);
router.patch('/bookings/:id/checkin',  requireAdmin, bookings.checkinBooking);
router.patch('/bookings/:id/checkout', requireAdmin, bookings.checkoutBooking);
router.patch('/bookings/:id/cancel',   requireAdmin, bookings.cancelBooking);

module.exports = router;
