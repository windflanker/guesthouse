import 'dotenv/config';
import mongoose from 'mongoose';
import Room from '../models/Room.js';
import Admin from '../models/Admin.js';

await mongoose.connect(process.env.MONGO_URI);

const roomDefs = [
  // Category 3 — Brig & above (1 room)
  { number: 'R-101', name: 'Raigarh',          category: 3 },
  // Category 2 — Colonel & Brigadier (1 room)
  { number: 'R-102', name: 'Sinhgarh',          category: 2 },
  // Category 1 — Up to Lt Col (10 rooms)
  { number: 'R-103', name: 'Vishalgarh',         category: 1 },
  { number: 'R-104', name: 'Pratapgarh',         category: 1 },
  { number: 'R-105', name: 'Purandar',           category: 1 },
  { number: 'R-106', name: 'Panhala',            category: 1 },
  { number: 'R-107', name: 'Ajinkyatara',        category: 1 },
  { number: 'R-108', name: 'Torna - Pet Room',   category: 1 },
  { number: 'R-109', name: 'Sindhudurg',         category: 1 },
  { number: 'R-110', name: 'Suvarnadurg',        category: 1 },
  { number: 'R-111', name: 'Vijaydurg',          category: 1 },
  { number: 'R-112', name: 'Murud Janjira',      category: 1 },
];

// Clear existing rooms and re-seed cleanly
await Room.deleteMany({});
await Room.insertMany(roomDefs);
console.log('12 rooms seeded with Maratha fort names.');

const exists = await Admin.findOne({ username: 'admin' });
if (!exists) {
  await new Admin({ username: 'admin', password: 'admin123' }).save();
  console.log('Admin created: admin / admin123  — CHANGE THIS PASSWORD IMMEDIATELY.');
} else {
  console.log('Admin already exists, skipping.');
}

await mongoose.disconnect();
