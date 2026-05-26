import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

await mongoose.connect(process.env.MONGO_URI);

const admin = await Admin.findOne({ username: 'admin' });
if (admin) {
  admin.password = 'Secure#114';
  await admin.save();
  console.log('Admin password updated successfully!');
} else {
  console.log('Admin not found!');
}

await mongoose.disconnect();