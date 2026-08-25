import { Router } from 'express';
import Room from '../models/Room.js';
import Admin from '../models/Admin.js';

const router = Router();

// Seed route protected by secret key — resets everything
router.get('/', async (req, res) => {
  const secret = req.query.secret;
  if (!secret || secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ success: false, message: 'Forbidden — invalid secret key' });
  }
  try {
    await Room.deleteMany({});
    await Room.insertMany([
      { number: 'R-101', name: 'Raigarh',                 category: 3 },
      { number: 'R-102', name: 'Sinhgarh',                category: 2 },
      { number: 'R-103', name: 'Vishalgarh',              category: 1 },
      { number: 'R-104', name: 'Pratapgarh',              category: 1 },
      { number: 'R-105', name: 'Purandar',                category: 1 },
      { number: 'R-106', name: 'Panhala',                 category: 1 },
      { number: 'R-107', name: 'Ajinkyatara',             category: 1 },
      { number: 'R-108', name: 'Torna - Pet Room',        category: 1 },
      { number: 'R-109', name: 'Sindhudurg',              category: 1 },
      { number: 'R-110', name: 'Suvarnadurg',             category: 1 },
      { number: 'R-111', name: 'Vijaydurg',               category: 1 },
      { number: 'R-112', name: 'Murud Janjira',           category: 1 },
      { number: 'R-113', name: 'Rizangla',                category: 1 },
      { number: 'R-114', name: 'Zojila',                  category: 1 },
      { number: 'R-115', name: 'Tololing',                category: 1 },
      { number: 'R-116', name: 'Hilli (Single Bed room)', category: 1 },
    ]);
    await Admin.deleteMany({});
    await new Admin({ username: 'admin',   password: 'Secure#114',  role: 'admin'   }).save();
    await new Admin({ username: 'manager', password: 'Manager#114', role: 'manager' }).save();
    res.json({ success: true, message: '16 rooms, admin and manager accounts created successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Seed failed' });
  }
});

// SAFE route — only adds new rooms, does NOT delete existing bookings or data
router.get('/add-rooms', async (req, res) => {
  const secret = req.query.secret;
  if (!secret || secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ success: false, message: 'Forbidden — invalid secret key' });
  }
  try {
    const newRooms = [
      { number: 'R-113', name: 'Rizangla',                category: 1 },
      { number: 'R-114', name: 'Zojila',                  category: 1 },
      { number: 'R-115', name: 'Tololing',                category: 1 },
      { number: 'R-116', name: 'Hilli (Single Bed room)', category: 1 },
    ];

    const results = [];
    for (const room of newRooms) {
      const exists = await Room.findOne({ number: room.number });
      if (!exists) {
        await Room.create(room);
        results.push(`✅ Added ${room.number} — ${room.name}`);
      } else {
        results.push(`⚠️ Skipped ${room.number} — already exists`);
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add rooms' });
  }
});

export default router;
