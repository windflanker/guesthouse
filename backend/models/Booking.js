import mongoose from 'mongoose';

const officerSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  rank:        { type: String, required: true },
  unit:        { type: String },
  mobile:      { type: String, required: true },
  email:       { type: String },
  idType:      { type: String },
  idNumber:    { type: String },
  arrivalTime: { type: String },
  reference:   { type: String },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  ref:           { type: String, unique: true },
  officer:       { type: officerSchema, required: true },
  category:      { type: Number, enum: [1, 2, 3], required: true },
  room:          { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  checkin:       { type: String, required: true },
  checkout:      { type: String, required: true },
  actualCheckout:{ type: String },
  status:        { type: String, enum: ['Pending','Approved','Rejected','Checked In','Checked Out','Cancelled'], default: 'Pending' },
  cancelReason:  { type: String },
  notes:         { type: String },
}, { timestamps: true });

bookingSchema.pre('save', async function () {
  if (!this.ref) {
    const count = await mongoose.model('Booking').countDocuments();
    this.ref = 'BK-' + String(count + 1).padStart(3, '0');
  }
});

export default mongoose.model('Booking', bookingSchema);
