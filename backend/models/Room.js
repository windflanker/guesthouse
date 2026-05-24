import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  number:   { type: String, required: true, unique: true },
  name:     { type: String, default: '' },   // e.g. "Arjuna Suite", "River View Room"
  category: { type: Number, enum: [1, 2, 3], required: true },
  status:   { type: String, enum: ['available', 'pending', 'occupied'], default: 'available' },
  currentGuest:   { type: String, default: null },
  currentBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
}, { timestamps: true });

export default mongoose.model('Room', roomSchema);
