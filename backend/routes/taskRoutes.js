import express from 'express';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const getUserId = (req) => req.user?._id || req.user?.id || null;

router.get('/mine', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const tasks = await Task.find({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your tasks', error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = { ...req.body };
    delete payload._id;
    delete payload.createdBy;

    if (payload.dueDate) {
      payload.dueDate = new Date(payload.dueDate);
    }

    payload.createdBy = userId;

    const task = await Task.create(payload);
    const populatedTask = await task.populate(['createdBy', 'assignedTo']);
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create task', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Invalid task id', error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const populatedTask = await task.populate(['createdBy', 'assignedTo']);
    res.json(populatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update task', error: error.message });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const populatedTask = await task.populate(['createdBy', 'assignedTo']);
    res.json(populatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update task status', error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete task', error: error.message });
  }
});

export default router;
