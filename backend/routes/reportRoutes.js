import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/"/g, '""');
  return /[",\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
};

const buildCsv = (headers, rows) => {
  const headerLine = headers.join(',');
  const bodyLines = rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(','));
  return [headerLine, ...bodyLines].join('\n');
};

router.get('/task-summary', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const taskQuery = { $or: [{ createdBy: userId }, { assignedTo: userId }] };

    const totalTasks = await Task.countDocuments(taskQuery);
    const completedTasks = await Task.countDocuments({ ...taskQuery, status: 'done' });
    const pendingTasks = await Task.countDocuments({ ...taskQuery, status: { $ne: 'done' } });
    const usersCount = await User.countDocuments();

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      usersCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate task summary', error: error.message });
  }
});

router.get('/tasks-by-status', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const grouped = await Task.aggregate([
      { $match: { $or: [{ createdBy: userId }, { assignedTo: userId }] } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate status report', error: error.message });
  }
});

router.get('/tasks-by-priority', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const grouped = await Task.aggregate([
      { $match: { $or: [{ createdBy: userId }, { assignedTo: userId }] } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate priority report', error: error.message });
  }
});

router.get('/all-user-task-report', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const users = await User.find().select('name email role').sort({ createdAt: -1 });
    const tasks = await Task.find({ $or: [{ createdBy: userId }, { assignedTo: userId }] })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const rows = [];

    users.forEach((user) => {
      const assignedTasks = tasks.filter((task) => String(task.assignedTo?._id || task.assignedTo) === String(user._id));

      if (assignedTasks.length === 0) {
        rows.push({
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          taskTitle: 'No tasks assigned',
          taskStatus: '',
          taskPriority: '',
          taskDueDate: '',
          taskCategory: '',
        });
        return;
      }

      assignedTasks.forEach((task) => {
        rows.push({
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          taskTitle: task.title,
          taskStatus: task.status,
          taskPriority: task.priority,
          taskDueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          taskCategory: task.category,
        });
      });
    });

    const csv = buildCsv(
      ['userName', 'userEmail', 'userRole', 'taskTitle', 'taskStatus', 'taskPriority', 'taskDueDate', 'taskCategory'],
      rows,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="all-user-task-report.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate all user task report', error: error.message });
  }
});

router.get('/detailed-task-report', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({ $or: [{ createdBy: userId }, { assignedTo: userId }] })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const rows = tasks.map((task) => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      category: task.category,
      createdBy: task.createdBy?.name || 'Unknown',
      assignedTo: task.assignedTo?.name || 'Unassigned',
      createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : '',
      updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : '',
    }));

    const csv = buildCsv(
      ['title', 'description', 'status', 'priority', 'dueDate', 'category', 'createdBy', 'assignedTo', 'createdAt', 'updatedAt'],
      rows,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="detailed-task-report.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate detailed task report', error: error.message });
  }
});

export default router;
