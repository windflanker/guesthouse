/**
 * SMS Service — MSG91
 * Docs: https://docs.msg91.com/reference/send-sms
 *
 * Set in .env:
 *   MSG91_AUTH_KEY
 *   MSG91_SENDER_ID   (e.g. GHBOOK)
 *   MSG91_TEMPLATE_ID (DLT registered template ID)
 */

const BASE_URL = 'https://api.msg91.com/api/v5/flow/';

async function send(mobile, message) {
  if (!process.env.MSG91_AUTH_KEY) {
    // Dev mode — just log
    console.log(`[SMS DEV] To: ${mobile} | Msg: ${message}`);
    return;
  }

  const payload = {
    template_id: process.env.MSG91_TEMPLATE_ID,
    sender:      process.env.MSG91_SENDER_ID,
    short_url:   '0',
    mobiles:     mobile.replace(/\s+/g, ''),
    VAR1:        message,
  };

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': process.env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error('[SMS] Failed:', await res.text());
  }
}

// ------ Notification helpers ------

export async function smsApproved(booking) {
  await send(
    booking.officer.mobile,
    `Dear ${booking.officer.rank} ${booking.officer.name}, your booking ${booking.ref} is APPROVED. Room ${booking.room?.number || ''} assigned. Check-in: ${booking.checkin}. Officers' Guest House.`
  );
}

export async function smsRejected(booking) {
  await send(
    booking.officer.mobile,
    `Dear ${booking.officer.rank} ${booking.officer.name}, booking ${booking.ref} has been REJECTED. Please contact the guest house office for details.`
  );
}

export async function smsCheckedIn(booking) {
  await send(
    booking.officer.mobile,
    `Welcome ${booking.officer.rank} ${booking.officer.name}! You are checked in to Room ${booking.room?.number || ''}. Checkout: ${booking.checkout}. Officers' Guest House.`
  );
}

export async function smsCheckedOut(booking) {
  await send(
    booking.officer.mobile,
    `Dear ${booking.officer.rank} ${booking.officer.name}, you have been checked out of Room ${booking.room?.number || ''} on ${booking.actualCheckout || booking.checkout}. Thank you for your stay. Officers' Guest House.`
  );
}

export async function smsCancelled(booking) {
  await send(
    booking.officer.mobile,
    `Dear ${booking.officer.rank} ${booking.officer.name}, booking ${booking.ref} has been CANCELLED. Reason: ${booking.cancelReason}. Contact the office for queries.`
  );
}
