import { Router } from 'express';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const [rooms, allBookings] = await Promise.all([
    Room.find(),
    Booking.find().populate('room', 'number name category'),
  ]);

  const today = new Date().toISOString().split('T')[0];

  // Active bookings today — checkin <= today < checkout
  const activeToday = allBookings.filter(b =>
    ['Approved', 'Checked In'].includes(b.status) &&
    b.checkin <= today &&
    b.checkout > today
  );

  // Occupied room IDs today
  const occupiedRoomIds = new Set(
    activeToday.filter(b => b.room).map(b => b.room._id.toString())
  );

  // Room stats based on actual bookings today
  const roomStats = {
    total:     rooms.length,
    occupied:  occupiedRoomIds.size,
    available: rooms.length - occupiedRoomIds.size,
    pending:   allBookings.filter(b => b.status === 'Pending').length,
  };

  const occupancyRate = Math.round((roomStats.occupied / roomStats.total) * 100);

  // Booking stats
  const bookingStats = {
    pendingApproval: allBookings.filter(b => b.status === 'Pending').length,
    checkedIn:       allBookings.filter(b => b.status === 'Checked In').length,
    checkedOut:      allBookings.filter(b => b.status === 'Checked Out').length,
    cancelled:       allBookings.filter(b => b.status === 'Cancelled').length,
    total:           allBookings.length,
  };

  const cancellationRate = bookingStats.total > 0
    ? Math.round((bookingStats.cancelled / bookingStats.total) * 100) : 0;

  // Average length of stay
  const stayLengths = allBookings
    .filter(b => b.status === 'Checked Out' && b.checkin && b.actualCheckout)
    .map(b => {
      const diff = new Date(b.actualCheckout) - new Date(b.checkin);
      return diff / (1000 * 60 * 60 * 24);
    });
  const avgStay = stayLengths.length > 0
    ? (stayLengths.reduce((a, b) => a + b, 0) / stayLengths.length).toFixed(1) : 0;

  // Category occupancy — based on actual bookings today
  const categoryOccupancy = [1, 2, 3].map(cat => {
    const catRooms = rooms.filter(r => r.category === cat);
    const catOccupied = activeToday.filter(b =>
      b.room && catRooms.some(r => r._id.toString() === b.room._id.toString())
    ).length;
    return {
      category: cat,
      total:    catRooms.length,
      occupied: catOccupied,
      bookings: allBookings.filter(b => b.category === cat).length,
    };
  });

  // Monthly bookings (last 12 months)
  const now = new Date();
  const monthlyBookings = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const count = allBookings.filter(b => b.checkin && b.checkin.startsWith(monthStr)).length;
    return { month: label, count };
  });

  // Upcoming check-ins (next 7 days) — Approved bookings
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in7Str = in7.toISOString().split('T')[0];

  const upcomingCheckins = allBookings
    .filter(b => b.status === 'Approved' && b.checkin >= today && b.checkin <= in7Str)
    .sort((a, b) => a.checkin.localeCompare(b.checkin))
    .slice(0, 5);

  // Upcoming check-outs (next 7 days) — Approved OR Checked In
  const upcomingCheckouts = allBookings
    .filter(b =>
      ['Approved', 'Checked In'].includes(b.status) &&
      b.checkout >= today &&
      b.checkout <= in7Str
    )
    .sort((a, b) => a.checkout.localeCompare(b.checkout))
    .slice(0, 5);

  // Pending > 24hrs alert
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const stalePending = allBookings.filter(b =>
    b.status === 'Pending' && new Date(b.createdAt) < yesterday
  ).length;

  // Monthly comparison
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthCount = allBookings.filter(b => b.checkin?.startsWith(thisMonth)).length;
  const lastMonthCount = allBookings.filter(b => b.checkin?.startsWith(lastMonth)).length;

  const recentBookings = [...allBookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  res.json({
    roomStats, occupancyRate, bookingStats, cancellationRate, avgStay,
    categoryOccupancy, monthlyBookings, upcomingCheckins, upcomingCheckouts,
    stalePending, thisMonthCount, lastMonthCount, recentBookings,
  });
});

export default router;
