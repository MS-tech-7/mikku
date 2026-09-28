const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  idCard: { type: String, required: true, trim: true },
  role: {
    type: String,
    enum: ['student', 'teacher', 'society_head'],
    default: 'student'
  },
  department: { type: String, default: '' },
  year: { type: String, default: '' },
  skills: [{ type: String, trim: true }],
  bio: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
