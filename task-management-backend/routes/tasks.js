const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Task = require('../models/Task');
const {
  cacheMiddleware,
  invalidateCache,
  getCacheStats,
} = require('../middleware/cache');
const taskEvents = require('../events');

function isValidObjectId(id) {
  return mongoose.isValidObjectId(id);
}

// CREATE - POST /tasks
// Pipeline: cache middleware ignored (write) -> save -> respond -> emit event.
router.post('/', async (req, res, next) => {
  try {
    const { title, description, assignedUser } = req.body;
    const newTask = await Task.create({ title, description, assignedUser });
    invalidateCache();

    // Respond FIRST so the client is never blocked by the notification.
    console.log(`[API] POST /tasks response sent at ${new Date().toISOString()}`);
    res.status(201).json(newTask);

    // Emitted AFTER the response. `emit()` does not wait for the async
    // listener to finish, so the API latency stays low.
    taskEvents.emit('task-created', newTask);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next(err);
  }
});

// READ ALL - GET /tasks (cached for 60s by the cache middleware)
router.get('/', cacheMiddleware, async (req, res, next) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// Cache diagnostics
router.get('/cache/stats', (req, res) => {
  res.json(getCacheStats());
});

router.delete('/cache', (req, res) => {
  invalidateCache();
  res.json({ message: 'Cache cleared successfully' });
});

// READ ONE - GET /tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task id' });
    }
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// UPDATE - PUT /tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task id' });
    }
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    invalidateCache();
    res.status(200).json(task);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next(err);
  }
});

// DELETE - DELETE /tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task id' });
    }
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    invalidateCache();
    res.status(200).json({ message: 'Task deleted successfully' });

    // Fire the delete notification asynchronously, after responding.
    taskEvents.emit('task-deleted', task);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
