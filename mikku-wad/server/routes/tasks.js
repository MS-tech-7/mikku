const express = require('express');
const Task = require('../models/Task');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { search = '', category = '', status = '' } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  const tasks = await Task.find(filter)
    .populate('owner', 'name username role department')
    .populate('assignedTo', 'name username')
    .populate('offers.applicant', 'name username role rating')
    .sort({ createdAt: -1 });
  res.json({ tasks });
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, category, budget, deadline } = req.body;
    if (!title || !description || !category || budget === undefined || !deadline) {
      return res.status(400).json({ message: 'Fill all task fields.' });
    }
    const task = await Task.create({
      title, description, category,
      budget: Number(budget),
      deadline: new Date(deadline),
      owner: req.session.userId
    });
    const populated = await task.populate('owner', 'name username role department');
    res.status(201).json({ message: 'Task posted.', task: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create task.' });
  }
});

router.post('/:id/offers', requireAuth, async (req, res) => {
  try {
    const { amount, message } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    if (task.owner.toString() === req.session.userId) {
      return res.status(400).json({ message: 'You cannot apply to your own task.' });
    }
    if (task.status !== 'open') return res.status(400).json({ message: 'This task is no longer open.' });
    if (task.offers.some(o => o.applicant.toString() === req.session.userId)) {
      return res.status(409).json({ message: 'You already submitted an offer.' });
    }

    task.offers.push({ applicant: req.session.userId, amount: Number(amount), message });
    await task.save();
    res.status(201).json({ message: 'Offer submitted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not submit offer.' });
  }
});

router.post('/:taskId/offers/:offerId/accept', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    if (task.owner.toString() !== req.session.userId) return res.status(403).json({ message: 'Only the task owner can assign this task.' });

    const offer = task.offers.id(req.params.offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found.' });

    task.offers.forEach(o => { o.status = o._id.equals(offer._id) ? 'accepted' : 'rejected'; });
    task.assignedTo = offer.applicant;
    task.status = 'assigned';
    await task.save();
    res.json({ message: 'Offer accepted and task assigned.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not accept offer.' });
  }
});

router.post('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'assigned', 'in_progress', 'completed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status.' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const userId = req.session.userId;
    const canUpdate = task.owner.toString() === userId || (task.assignedTo && task.assignedTo.toString() === userId);
    if (!canUpdate) return res.status(403).json({ message: 'You are not part of this task.' });

    task.status = status;
    await task.save();
    res.json({ message: 'Task status updated.', status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update task.' });
  }
});

module.exports = router;
