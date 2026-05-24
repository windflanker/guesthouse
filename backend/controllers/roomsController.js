const { pool } = require('../config/db');

async function getRooms(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        r.id, r.room_no, r.category, r.status,
        b.ref        AS booking_ref,
        b.id         AS booking_id,
        b.officer_name,
        b.rank,
        b.checkin_date,
        b.checkout_date
      FROM rooms r
      LEFT JOIN bookings b
        ON b.room_id = r.id
        AND b.status IN ('Approved', 'Checked In')
      ORDER BY r.category, r.room_no
    `);
    res.json({ rooms: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRooms };
