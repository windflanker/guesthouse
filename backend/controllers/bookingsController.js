const { pool } = require('../config/db');
const { sendSMS } = require('../config/sms');

// Map rank to category
const RANK_CATEGORY = {
  '2Lt': 1, 'Lt': 1, 'Capt': 1, 'Major': 1, 'Lt Col': 1,
  'Colonel': 2,
  'Brigadier': 3, 'Maj Gen': 3, 'Lt Gen': 3, 'General': 3,
};

// ── List bookings ──────────────────────────────────────────────────────────────
async function listBookings(req, res, next) {
  try {
    const { status, category, from, to } = req.query;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`b.status = $${params.length}`);
    }
    if (category) {
      params.push(parseInt(category));
      conditions.push(`b.category = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conditions.push(`b.checkin_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`b.checkout_date <= $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await pool.query(`
      SELECT
        b.*,
        r.room_no
      FROM bookings b
      LEFT JOIN rooms r ON r.id = b.room_id
      ${where}
      ORDER BY b.created_at DESC
    `, params);

    res.json({ bookings: rows });
  } catch (err) {
    next(err);
  }
}

// ── Get single booking ─────────────────────────────────────────────────────────
async function getBooking(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT b.*, r.room_no
      FROM bookings b
      LEFT JOIN rooms r ON r.id = b.room_id
      WHERE b.id = $1
    `, [req.params.id]);

    if (!rows[0]) return res.status(404).json({ error: 'Booking not found.' });
    res.json({ booking: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── Create booking request ─────────────────────────────────────────────────────
async function createBooking(req, res, next) {
  try {
    const {
      officer_name, rank, unit, mobile, email,
      id_type, id_number, checkin_date, checkout_date,
    } = req.body;

    // Validate required fields
    if (!officer_name || !rank || !unit || !mobile || !checkin_date || !checkout_date) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const category = RANK_CATEGORY[rank];
    if (!category) {
      return res.status(400).json({ error: 'Invalid rank value.' });
    }

    if (new Date(checkout_date) <= new Date(checkin_date)) {
      return res.status(400).json({ error: 'Checkout date must be after check-in date.' });
    }

    const { rows } = await pool.query(`
      INSERT INTO bookings
        (officer_name, rank, unit, mobile, email, id_type, id_number,
         category, checkin_date, checkout_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [officer_name, rank, unit, mobile, email || null,
        id_type || null, id_number || null,
        category, checkin_date, checkout_date]);

    res.status(201).json({ booking: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── Approve + assign room ──────────────────────────────────────────────────────
async function approveBooking(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { room_id } = req.body;
    if (!room_id) return res.status(400).json({ error: 'room_id is required.' });

    // Fetch booking
    const { rows: bRows } = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const booking = bRows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.status !== 'Pending') {
      return res.status(409).json({ error: `Cannot approve a booking with status "${booking.status}".` });
    }

    // Verify room is available and correct category
    const { rows: rRows } = await client.query(
      `SELECT * FROM rooms WHERE id = $1 FOR UPDATE`,
      [room_id]
    );
    const room = rRows[0];
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (room.status !== 'available') {
      return res.status(409).json({ error: `Room ${room.room_no} is not available.` });
    }
    if (room.category !== booking.category) {
      return res.status(400).json({ error: `Room ${room.room_no} is not in Category ${booking.category}.` });
    }

    // Update booking
    const { rows: updated } = await client.query(`
      UPDATE bookings SET status = 'Approved', room_id = $1
      WHERE id = $2 RETURNING *
    `, [room_id, booking.id]);

    // Mark room as pending
    await client.query(
      `UPDATE rooms SET status = 'pending' WHERE id = $1`,
      [room_id]
    );

    await client.query('COMMIT');

    // Send SMS
    await sendSMS(booking.id, booking.mobile, 'approved', {
      name: booking.officer_name,
      ref: booking.ref,
      room: room.room_no,
      checkin: booking.checkin_date,
    });

    res.json({ booking: { ...updated[0], room_no: room.room_no } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ── Reject booking ─────────────────────────────────────────────────────────────
async function rejectBooking(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason is required.' });

    const { rows } = await pool.query(
      `UPDATE bookings SET status = 'Rejected', cancel_reason = $1
       WHERE id = $2 AND status = 'Pending' RETURNING *`,
      [reason, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Pending booking not found.' });

    await sendSMS(rows[0].id, rows[0].mobile, 'rejected', {
      name: rows[0].officer_name,
      ref: rows[0].ref,
      reason,
    });

    res.json({ booking: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── Check in ──────────────────────────────────────────────────────────────────
async function checkinBooking(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: bRows } = await client.query(
      `SELECT b.*, r.room_no FROM bookings b
       LEFT JOIN rooms r ON r.id = b.room_id
       WHERE b.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const booking = bRows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.status !== 'Approved') {
      return res.status(409).json({ error: `Cannot check in a booking with status "${booking.status}".` });
    }

    const { rows: updated } = await client.query(
      `UPDATE bookings SET status = 'Checked In' WHERE id = $1 RETURNING *`,
      [booking.id]
    );
    await client.query(
      `UPDATE rooms SET status = 'occupied' WHERE id = $1`,
      [booking.room_id]
    );

    await client.query('COMMIT');

    await sendSMS(booking.id, booking.mobile, 'checkin', {
      name: booking.officer_name,
      room: booking.room_no,
      checkout: booking.checkout_date,
    });

    res.json({ booking: { ...updated[0], room_no: booking.room_no } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ── Check out ─────────────────────────────────────────────────────────────────
async function checkoutBooking(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { actual_checkout, admin_notes } = req.body;
    const checkoutDate = actual_checkout || new Date().toISOString().split('T')[0];

    const { rows: bRows } = await client.query(
      `SELECT b.*, r.room_no FROM bookings b
       LEFT JOIN rooms r ON r.id = b.room_id
       WHERE b.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const booking = bRows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.status !== 'Checked In') {
      return res.status(409).json({ error: `Cannot check out a booking with status "${booking.status}".` });
    }

    const { rows: updated } = await client.query(`
      UPDATE bookings
      SET status = 'Checked Out', actual_checkout = $1, admin_notes = $2
      WHERE id = $3 RETURNING *
    `, [checkoutDate, admin_notes || null, booking.id]);

    await client.query(
      `UPDATE rooms SET status = 'available' WHERE id = $1`,
      [booking.room_id]
    );

    await client.query('COMMIT');

    await sendSMS(booking.id, booking.mobile, 'checkout', {
      name: booking.officer_name,
      room: booking.room_no,
      date: checkoutDate,
    });

    res.json({ booking: { ...updated[0], room_no: booking.room_no } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ── Cancel booking ────────────────────────────────────────────────────────────
async function cancelBooking(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Cancellation reason is required.' });

    const { rows: bRows } = await client.query(
      `SELECT b.*, r.room_no FROM bookings b
       LEFT JOIN rooms r ON r.id = b.room_id
       WHERE b.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const booking = bRows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const nonCancellable = ['Checked Out', 'Cancelled', 'Rejected'];
    if (nonCancellable.includes(booking.status)) {
      return res.status(409).json({ error: `Cannot cancel a booking with status "${booking.status}".` });
    }

    const { rows: updated } = await client.query(`
      UPDATE bookings SET status = 'Cancelled', cancel_reason = $1
      WHERE id = $2 RETURNING *
    `, [reason, booking.id]);

    // Release room if one was assigned
    if (booking.room_id) {
      await client.query(
        `UPDATE rooms SET status = 'available' WHERE id = $1`,
        [booking.room_id]
      );
    }

    await client.query('COMMIT');

    await sendSMS(booking.id, booking.mobile, 'cancelled', {
      name: booking.officer_name,
      ref: booking.ref,
      reason,
    });

    res.json({ booking: { ...updated[0], room_no: booking.room_no } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ── Dashboard metrics ─────────────────────────────────────────────────────────
async function getDashboard(req, res, next) {
  try {
    const [roomStats, bookingStats, recentBookings, catOccupancy] = await Promise.all([
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM rooms GROUP BY status
      `),
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM bookings GROUP BY status
      `),
      pool.query(`
        SELECT b.ref, b.officer_name, b.rank, b.status, b.created_at, r.room_no
        FROM bookings b
        LEFT JOIN rooms r ON r.id = b.room_id
        ORDER BY b.created_at DESC LIMIT 8
      `),
      pool.query(`
        SELECT
          ro.category,
          COUNT(ro.id) AS total,
          COUNT(CASE WHEN ro.status = 'occupied' THEN 1 END) AS occupied
        FROM rooms ro
        GROUP BY ro.category ORDER BY ro.category
      `),
    ]);

    const roomMap = {};
    roomStats.rows.forEach(r => { roomMap[r.status] = parseInt(r.count); });

    const bookingMap = {};
    bookingStats.rows.forEach(r => { bookingMap[r.status] = parseInt(r.count); });

    res.json({
      rooms: {
        total: 12,
        available: roomMap.available || 0,
        pending:   roomMap.pending   || 0,
        occupied:  roomMap.occupied  || 0,
      },
      bookings: {
        pending:    bookingMap['Pending']     || 0,
        approved:   bookingMap['Approved']    || 0,
        checkedIn:  bookingMap['Checked In']  || 0,
        checkedOut: bookingMap['Checked Out'] || 0,
        cancelled:  bookingMap['Cancelled']   || 0,
      },
      recentBookings: recentBookings.rows,
      categoryOccupancy: catOccupancy.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listBookings, getBooking, createBooking,
  approveBooking, rejectBooking,
  checkinBooking, checkoutBooking, cancelBooking,
  getDashboard,
};
