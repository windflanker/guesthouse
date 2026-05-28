import { Router } from 'express';
import Room from '../models/Room.js';
import Admin from '../models/Admin.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await Room.deleteMany({});
    await Room.insertMany([
      { number: 'R-101', name: 'Raigarh',        category: 3 },
      { number: 'R-102', name: 'Sinhgarh',        category: 2 },
      { number: 'R-103', name: 'Vishalgarh',      category: 1 },
      { number: 'R-104', name: 'Pratapgarh',      category: 1 },
      { number: 'R-105', name: 'Purandar',        category: 1 },
      { number: 'R-106', name: 'Panhala',         category: 1 },
      { number: 'R-107', name: 'Ajinkyatara',     category: 1 },
      { number: 'R-108', name: 'Torna - Pet Room',category: 1 },
      { number: 'R-109', name: 'Sindhudurg',      category: 1 },
      { number: 'R-110', name: 'Suvarnadurg',     category: 1 },
      { number: 'R-111', name: 'Vijaydurg',       category: 1 },
      { number: 'R-112', name: 'Murud Janjira',   category: 1 },
    ]);

    await Admin.deleteMany({});
await new Admin({ username: 'admin', password: 'Secure#114' }).save();

    res.json({ success: true, message: '12 rooms and admin seeded successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
