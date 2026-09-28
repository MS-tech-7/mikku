const express = require('express');
const Service = require('../models/Service');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { search = '', category = '' } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { skills: { $regex: search, $options: 'i' } }
    ];
  }
  const services = await Service.find(filter).populate('owner', 'name username role rating skills').sort({ createdAt: -1 });
  res.json({ services });
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, category, price, skills } = req.body;
    if (!title || !description || !category || price === undefined) {
      return res.status(400).json({ message: 'Fill all service fields.' });
    }
    const service = await Service.create({
      title, description, category, price: Number(price),
      skills: Array.isArray(skills) ? skills : [],
      owner: req.session.userId
    });
    const populated = await service.populate('owner', 'name username role rating skills');
    res.status(201).json({ message: 'Service published.', service: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create service.' });
  }
});

module.exports = router;
