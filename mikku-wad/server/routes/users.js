const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).select('-password');
  res.json({ user });
});

router.put('/profile', requireAuth, async (req, res) => {
  const { name, department, year, bio, skills } = req.body;
  const user = await User.findByIdAndUpdate(
    req.session.userId,
    { name, department, year, bio, skills: Array.isArray(skills) ? skills : [] },
    { new: true, runValidators: true }
  ).select('-password');
  res.json({ message: 'Profile updated.', user });
});

router.get('/public', async (req, res) => {
  const users = await User.find().select('name username role department year skills rating ratingCount verified').limit(50);
  res.json({ users });
});

module.exports = router;
