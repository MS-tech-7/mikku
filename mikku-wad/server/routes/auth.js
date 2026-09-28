const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, phone, idCard, role, department, year, skills } = req.body;

    if (!username || !password || !name || !phone || !idCard || !role) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must contain exactly 10 digits.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must contain at least 6 characters.' });
    }

    const exists = await User.findOne({ username: username.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'Username already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      phone,
      idCard: idCard.trim(),
      role,
      department: department || '',
      year: year || '',
      skills: Array.isArray(skills) ? skills : [],
      verified: true
    });

    req.session.userId = user._id.toString();
    res.status(201).json({ message: 'Registration successful.', user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: (username || '').toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid username or password.' });

    const ok = await bcrypt.compare(password || '', user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid username or password.' });

    req.session.userId = user._id.toString();
    res.json({ message: 'Login successful.', user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully.' });
  });
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in.' });
  const user = await User.findById(req.session.userId);
  if (!user) return res.status(401).json({ message: 'User session is invalid.' });
  res.json({ user: publicUser(user) });
});

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    name: user.name,
    phone: user.phone,
    idCard: user.idCard,
    role: user.role,
    department: user.department,
    year: user.year,
    skills: user.skills,
    bio: user.bio,
    rating: user.rating,
    ratingCount: user.ratingCount,
    verified: user.verified
  };
}

module.exports = router;
