const axios = require('axios');
const { pool } = require('../config/db');

const MSG91_AUTH  = process.env.MSG91_AUTH_KEY;
const SENDER_ID   = process.env.MSG91_SENDER_ID || 'GHBOOK';

// SMS message templates
const templates = {
  approved: (data) =>
    `Dear ${data.name}, your booking ${data.ref} at Officers' Guest House has been APPROVED. Room ${data.room} assigned. Check-in: ${data.checkin}. -Guest House`,

  rejected: (data) =>
    `Dear ${data.name}, your booking ${data.ref} at Officers' Guest House has been rejected. Reason: ${data.reason}. For queries contact the admin. -Guest House`,

  checkin: (data) =>
    `Dear ${data.name}, you are now checked in to Room ${data.room} at Officers' Guest House. Checkout: ${data.checkout}. Welcome! -Guest House`,

  checkout: (data) =>
    `Dear ${data.name}, you have been checked out from Room ${data.room} on ${data.date}. Thank you for staying at Officers' Guest House. -Guest House`,

  cancelled: (data) =>
    `Dear ${data.name}, your booking ${data.ref} at Officers' Guest House has been CANCELLED. Reason: ${data.reason}. -Guest House`,
};

async function sendSMS(bookingId, mobile, event, templateData) {
  const message = templates[event]?.(templateData) || 'Booking update from Officers Guest House.';

  // Log the SMS attempt
  const { rows } = await pool.query(
    `INSERT INTO sms_log (booking_id, mobile, event, message, status)
     VALUES ($1, $2, $3, $4, 'queued') RETURNING id`,
    [bookingId, mobile, event, message]
  );
  const logId = rows[0].id;

  // In development, just log to console
  if (process.env.NODE_ENV !== 'production' || !MSG91_AUTH) {
    console.log(`[SMS DEV] To: ${mobile} | Event: ${event} | Msg: ${message}`);
    await pool.query(
      `UPDATE sms_log SET status = 'sent', sent_at = NOW(), provider_id = 'dev-mock'
       WHERE id = $1`,
      [logId]
    );
    return { success: true, mock: true };
  }

  // Production: send via MSG91
  try {
    const response = await axios.post(
      'https://api.msg91.com/api/v5/flow/',
      {
        template_id: process.env[`MSG91_TEMPLATE_ID_${event.toUpperCase()}`],
        short_url: '0',
        mobiles: mobile.replace(/\D/g, ''), // strip non-digits
        name: templateData.name,
        ref: templateData.ref || '',
        room: templateData.room || '',
        reason: templateData.reason || '',
      },
      {
        headers: {
          authkey: MSG91_AUTH,
          'Content-Type': 'application/json',
        },
      }
    );

    await pool.query(
      `UPDATE sms_log SET status = 'sent', sent_at = NOW(), provider_id = $1
       WHERE id = $2`,
      [response.data?.request_id || 'ok', logId]
    );
    return { success: true };
  } catch (err) {
    console.error('[SMS ERROR]', err.message);
    await pool.query(
      `UPDATE sms_log SET status = 'failed' WHERE id = $1`,
      [logId]
    );
    return { success: false, error: err.message };
  }
}

module.exports = { sendSMS };
