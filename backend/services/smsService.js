const axios = require('axios');
const pool  = require('../config/db');

const MSG91_URL = 'https://api.msg91.com/api/v5/flow/';

const TEMPLATES = {
  approved:  process.env.MSG91_TEMPLATE_ID_APPROVED,
  rejected:  process.env.MSG91_TEMPLATE_ID_REJECTED,
  checkin:   process.env.MSG91_TEMPLATE_ID_CHECKIN,
  checkout:  process.env.MSG91_TEMPLATE_ID_CHECKOUT,
  cancelled: process.env.MSG91_TEMPLATE_ID_CANCELLED,
};

// Template variables per event
function buildVariables(event, data) {
  switch (event) {
    case 'approved':
      return { officer_name: data.officer_name, ref: data.ref, room: data.room, checkin: data.checkin_date };
    case 'rejected':
      return { officer_name: data.officer_name, ref: data.ref };
    case 'checkin':
      return { officer_name: data.officer_name, room: data.room, checkout: data.checkout_date };
    case 'checkout':
      return { officer_name: data.officer_name, room: data.room, date: data.actual_checkout || data.checkout_date };
    case 'cancelled':
      return { officer_name: data.officer_name, ref: data.ref, reason: data.cancel_reason };
    default:
      return {};
  }
}

async function sendSMS(event, bookingData) {
  const mobile = bookingData.mobile.replace(/\D/g, ''); // digits only
  const templateId = TEMPLATES[event];
  const variables  = buildVariables(event, bookingData);

  // Log to DB regardless of send outcome
  const logQuery = `
    INSERT INTO sms_log (booking_id, mobile, message, event_type, status)
    VALUES ($1, $2, $3, $4, $5)
  `;

  if (!process.env.MSG91_AUTH_KEY || process.env.NODE_ENV === 'development') {
    console.log(`[SMS MOCK] event=${event} to=${mobile}`, variables);
    await pool.query(logQuery, [bookingData.id, mobile, JSON.stringify(variables), event, 'mock']);
    return { success: true, mock: true };
  }

  try {
    const payload = {
      template_id: templateId,
      short_url:   '0',
      recipients: [{
        mobiles: `91${mobile}`,
        ...variables,
      }],
    };

    const res = await axios.post(MSG91_URL, payload, {
      headers: {
        authkey:        process.env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    await pool.query(logQuery, [bookingData.id, mobile, JSON.stringify(variables), event, 'sent']);
    return { success: true, response: res.data };
  } catch (err) {
    console.error('[SMS ERROR]', err.message);
    await pool.query(logQuery, [bookingData.id, mobile, JSON.stringify(variables), event, 'failed']);
    return { success: false, error: err.message };
  }
}

module.exports = { sendSMS };
