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

  // Room stats
  const roomStats = {
    total:     rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    pending:   rooms.filter(r => r.status === 'pending').length,
    occupied:  rooms.filter(r => r.status === 'occupied').length,
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

  // Cancellation rate
  const cancellationRate = bookingStats.total > 0
    ? Math.round((bookingStats.cancelled / bookingStats.total) * 100) : 0;

  // Average length of stay (checked out bookings)
  const stayLengths = allBookings
    .filter(b => b.status === 'Checked Out' && b.checkin && b.actualCheckout)
    .map(b => {
      const diff = new Date(b.actualCheckout) - new Date(b.checkin);
      return diff / (1000 * 60 * 60 * 24);
    });
  const avgStay = stayLengths.length > 0
    ? (stayLengths.reduce((a, b) => a + b, 0) / stayLengths.length).toFixed(1) : 0;

  // Category occupancy
  const categoryOccupancy = [1, 2, 3].map(cat => ({
    category: cat,
    total:    rooms.filter(r => r.category === cat).length,
    occupied: rooms.filter(r => r.category === cat && r.status === 'occupied').length,
    bookings: allBookings.filter(b => b.category === cat).length,
  }));

  // Monthly bookings (last 12 months)
  const now = new Date();
  const monthlyBookings = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const count = allBookings.filter(b => b.checkin && b.checkin.startsWith(monthStr)).length;
    return { month: label, count };
  });

  // Upcoming check-ins (next 7 days)
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const upcomingCheckins = allBookings
    .filter(b => ['Approved'].includes(b.status) && b.checkin >= today && b.checkin <= in7.toISOString().split('T')[0])
    .sort((a, b) => a.checkin.localeCompare(b.checkin))
    .slice(0, 5);

  // Upcoming check-outs (next 7 days)
  const upcomingCheckouts = allBookings
    .filter(b => b.status === 'Checked In' && b.checkout >= today && b.checkout <= in7.toISOString().split('T')[0])
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

  const recentBookings = [...allBookings].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  res.json({
    roomStats, occupancyRate, bookingStats, cancellationRate, avgStay,
    categoryOccupancy, monthlyBookings, upcomingCheckins, upcomingCheckouts,
    stalePending, thisMonthCount, lastMonthCount, recentBookings,
  });
});

export default router;
