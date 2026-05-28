const AUTH_KEY = process.env.MSG91_AUTH_KEY;
const SENDER_ID = process.env.MSG91_SENDER_ID || 'GHBOOK';

const TEMPLATES = {
  approved:   '6a1877a41c1029ad1b0ed2d3',
  rejected:   '6a1877e1ac592fd9e905ccd4',
  checkedIn:  '6a187800994a412b890821a0',
  checkedOut: '6a18781d0928432b3b0864c3',
  cancelled:  '6a187848369c5f6dbc0e4362',
};

async function send(mobile, templateId, variables) {
  if (!AUTH_KEY) {
    console.log(`[SMS DEV] To: ${mobile} | Template: ${templateId} | Vars:`, variables);
    return;
  }

  const payload = {
    template_id: templateId,
    sender:      SENDER_ID,
    short_url:   '0',
    mobiles:     mobile.replace(/\s+/g, ''),
    ...variables,
  };

  try {
    const res = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': AUTH_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error('[SMS] Failed:', await res.text());
  } catch (err) {
    console.error('[SMS] Error:', err.message);
  }
}

export async function smsApproved(booking) {
  await send(booking.officer.mobile, TEMPLATES.approved, {
    name: `${booking.officer.rank} ${booking.officer.name}`,
    ref:  booking.ref,
    room: booking.room?.name || booking.room?.number || '',
    date: booking.checkin,
  });
}

export async function smsRejected(booking) {
  await send(booking.officer.mobile, TEMPLATES.rejected, {
    name: `${booking.officer.rank} ${booking.officer.name}`,
    ref:  booking.ref,
  });
}

export async function smsCheckedIn(booking) {
  await send(booking.officer.mobile, TEMPLATES.checkedIn, {
    name: `${booking.officer.rank} ${booking.officer.name}`,
    room: booking.room?.name || booking.room?.number || '',
    date: booking.checkout,
  });
}

export async function smsCheckedOut(booking) {
  await send(booking.officer.mobile, TEMPLATES.checkedOut, {
    name: `${booking.officer.rank} ${booking.officer.name}`,
    room: booking.room?.name || booking.room?.number || '',
    date: booking.actualCheckout || booking.checkout,
  });
}

export async function smsCancelled(booking) {
  await send(booking.officer.mobile, TEMPLATES.cancelled, {
    name:   `${booking.officer.rank} ${booking.officer.name}`,
    ref:    booking.ref,
    reason: booking.cancelReason,
  });
}