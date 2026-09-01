import { Router } from 'express';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const DOMI_NUMBERS   = ['R-113', 'R-114', 'R-115', 'R-116'];
const SAHYADRI_NUMBERS = ['R-101', 'R-102', 'R-103', 'R-104', 'R-105', 'R-106', 'R-107', 'R-108', 'R-109', 'R-110', 'R-111', 'R-112'];

function getBlockStats(rooms, bookings, date, blockNumbers) {
  const blockRooms = rooms.filter(r => blockNumbers.includes(r.number));
  const activeOnDate = bookings.filter(b =>
    ['Approved', 'Checked In'].includes(b.status) &&
    b.checkin <= date &&
    b.checkout > date &&
    b.room &&
    blockRooms.some(r => r._id.toString() === b.room._id.toString())
  );
  const occupiedIds = new Set(activeOnDate.map(b => b.room._id.toString()));
  const pendingApproval = bookings.filter(b =>
    b.status === 'Pending' &&
    b.room === null &&
    blockRooms.some(r => r.category === b.category)
  ).length;

  return {
    total:           blockRooms.length,
    occupied:        occupiedIds.size,
    available:       blockRooms.length - occupiedIds.size,
    pendingApproval: bookings.filter(b => b.status === 'Pending').length,
  };
}

router.get('/', requireAuth, async (_req, res) => {
  try {
    const [rooms, allBookings] = await Promise.all([
      Room.find(),
      Booking.find().populate('room', 'number name category'),
    ]);

    const today = new Date().toISOString().split('T')[0];

    // Active bookings today
    const activeToday = allBookings.filter(b =>
      ['Approved', 'Checked In'].includes(b.status) &&
      b.checkin <= today &&
      b.checkout > today
    );

    const occupiedRoomIds = new Set(
      activeToday.filter(b => b.room).map(b => b.room._id.toString())
    );

    // Overall room stats today
    const roomStats = {
      total:     rooms.length,
      occupied:  occupiedRoomIds.size,
      available: rooms.length - occupiedRoomIds.size,
      pending:   rooms.filter(r => r.status === 'pending').length,
    };

    // Booking stats
    const bookingStats = {
      pendingApproval: allBookings.filter(b => b.status === 'Pending').length,
      checkedIn:       allBookings.filter(b => b.status === 'Checked In').length,
      checkedOut:      allBookings.filter(b => b.status === 'Checked Out').length,
      cancelled:       allBookings.filter(b => b.status === 'Cancelled').length,
      total:           allBookings.length,
    };

    // Category occupancy
    const categoryOccupancy = [1, 2, 3].map(cat => {
      const catRooms = rooms.filter(r => r.category === cat);
      const catOccupied = activeToday.filter(b =>
        b.room && catRooms.some(r => r._id.toString() === b.room._id.toString())
      ).length;
      return {
        category: cat,
        total:    catRooms.length,
        occupied: catOccupied,
      };
    });

    // DOMI stats today
    const domiStats = {
      total:           rooms.filter(r => DOMI_NUMBERS.includes(r.number)).length,
      occupied:        activeToday.filter(b => b.room && DOMI_NUMBERS.includes(b.room.number)).length,
      available:       0,
      pendingApproval: allBookings.filter(b => b.status === 'Pending' && b.room && DOMI_NUMBERS.includes(b.room.number)).length,
    };
    domiStats.available = domiStats.total - domiStats.occupied;

    // Sahyadri stats today
    const sahyadriStats = {
      total:           rooms.filter(r => SAHYADRI_NUMBERS.includes(r.number)).length,
      occupied:        activeToday.filter(b => b.room && SAHYADRI_NUMBERS.includes(b.room.number)).length,
      available:       0,
      pendingApproval: allBookings.filter(b => b.status === 'Pending' && b.room && SAHYADRI_NUMBERS.includes(b.room.number)).length,
    };
    sahyadriStats.available = sahyadriStats.total - sahyadriStats.occupied;

    // Overall pending approval (not yet assigned to any room)
    const overallPendingApproval = allBookings.filter(b => b.status === 'Pending').length;

    // Upcoming check-ins (next 7 days)
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    const in7Str = in7.toISOString().split('T')[0];

    const upcomingCheckins = allBookings
      .filter(b => b.status === 'Approved' && b.checkin >= today && b.checkin <= in7Str)
      .sort((a, b) => a.checkin.localeCompare(b.checkin))
      .slice(0, 5);

    const upcomingCheckouts = allBookings
      .filter(b => ['Approved', 'Checked In'].includes(b.status) && b.checkout >= today && b.checkout <= in7Str)
      .sort((a, b) => a.checkout.localeCompare(b.checkout))
      .slice(0, 5);

    // Recent bookings
    const recentBookings = [...allBookings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

    // Pending > 24hrs
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const stalePending = allBookings.filter(b =>
      b.status === 'Pending' && new Date(b.createdAt) < yesterday
    ).length;

    res.json({
      roomStats,
      bookingStats,
      categoryOccupancy,
      domiStats,
      sahyadriStats,
      overallPendingApproval,
      upcomingCheckins,
      upcomingCheckouts,
      recentBookings,
      stalePending,
      today,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Date-specific stats endpoint
router.get('/date/:date', requireAuth, async (req, res) => {
  try {
    const [rooms, allBookings] = await Promise.all([
      Room.find(),
      Booking.find().populate('room', 'number name category'),
    ]);

    const date = req.params.date;

    const activeOnDate = allBookings.filter(b =>
      ['Approved', 'Checked In'].includes(b.status) &&
      b.checkin <= date &&
      b.checkout > date
    );

    const occupiedIds = new Set(
      activeOnDate.filter(b => b.room).map(b => b.room._id.toString())
    );

    const domiRooms     = rooms.filter(r => DOMI_NUMBERS.includes(r.number));
    const sahyadriRooms = rooms.filter(r => SAHYADRI_NUMBERS.includes(r.number));

    const domiOccupied = activeOnDate.filter(b =>
      b.room && DOMI_NUMBERS.includes(b.room.number)
    ).length;

    const sahyadriOccupied = activeOnDate.filter(b =>
      b.room && SAHYADRI_NUMBERS.includes(b.room.number)
    ).length;

    const pendingApproval = allBookings.filter(b => b.status === 'Pending').length;

    res.json({
      date,
      overall: {
        total:           rooms.length,
        available:       rooms.length - occupiedIds.size,
        occupied:        occupiedIds.size,
        pendingApproval,
      },
      domi: {
        total:     domiRooms.length,
        available: domiRooms.length - domiOccupied,
        occupied:  domiOccupied,
        pendingApproval,
      },
      sahyadri: {
        total:     sahyadriRooms.length,
        available: sahyadriRooms.length - sahyadriOccupied,
        occupied:  sahyadriOccupied,
        pendingApproval,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Booking trend (for the dashboard graph + Week/Month/Quarter/Year dropdown) ──
const fmt = (d) => d.toISOString().split('T')[0];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildBuckets(period) {
  const now = new Date();
  const utcToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  if (period === 'week') {
    // 8 buckets, one per week (Mon–Sun), oldest first.
    const day = (utcToday.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    const thisWeekStart = new Date(utcToday); thisWeekStart.setUTCDate(utcToday.getUTCDate() - day);
    return Array.from({ length: 8 }, (_, i) => {
      const start = new Date(thisWeekStart); start.setUTCDate(thisWeekStart.getUTCDate() - (7 - i) * 7);
      const end = new Date(start); end.setUTCDate(start.getUTCDate() + 7);
      return { start: fmt(start), end: fmt(end), label: `${start.getUTCDate()} ${MONTH_SHORT[start.getUTCMonth()]}` };
    });
  }

  if (period === 'quarter') {
    // 8 buckets, one per quarter, oldest first.
    const thisQ = Math.floor(utcToday.getUTCMonth() / 3);
    return Array.from({ length: 8 }, (_, i) => {
      const totalQ = utcToday.getUTCFullYear() * 4 + thisQ - (7 - i);
      const y = Math.floor(totalQ / 4), q = totalQ % 4;
      const start = new Date(Date.UTC(y, q * 3, 1));
      const end = new Date(Date.UTC(y, q * 3 + 3, 1));
      return { start: fmt(start), end: fmt(end), label: `Q${q + 1} '${String(y).slice(2)}` };
    });
  }

  if (period === 'year') {
    // 5 buckets, one per year, oldest first.
    return Array.from({ length: 5 }, (_, i) => {
      const y = utcToday.getUTCFullYear() - (4 - i);
      return { start: fmt(new Date(Date.UTC(y, 0, 1))), end: fmt(new Date(Date.UTC(y + 1, 0, 1))), label: String(y) };
    });
  }

  // 'month' (default): 12 buckets, one per month, oldest first.
  return Array.from({ length: 12 }, (_, i) => {
    const start = new Date(Date.UTC(utcToday.getUTCFullYear(), utcToday.getUTCMonth() - (11 - i), 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return { start: fmt(start), end: fmt(end), label: `${MONTH_SHORT[start.getUTCMonth()]} '${String(start.getUTCFullYear()).slice(2)}` };
  });
}

// GET /api/dashboard/trend?period=week|month|quarter|year
// Counts bookings (excluding Rejected/Cancelled) by check-in date, bucketed.
router.get('/trend', requireAuth, async (req, res) => {
  try {
    const period = ['week', 'month', 'quarter', 'year'].includes(req.query.period) ? req.query.period : 'month';
    const buckets = buildBuckets(period);

    const bookings = await Booking.find(
      { status: { $nin: ['Rejected', 'Cancelled'] } },
      'checkin'
    ).lean();

    const counts = buckets.map(b =>
      bookings.filter(bk => bk.checkin >= b.start && bk.checkin < b.end).length
    );

    res.json({
      period,
      buckets: buckets.map((b, i) => ({ label: b.label, count: counts[i] })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
