require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');

// Register the Practical 10 event listeners once, at start-up, so the
// task-created / task-deleted events emitted by the routes are handled.
require('./listeners');

const app = express();

// CORS - the Vite dev server calls this API directly (no proxy).
app.use(cors());
app.use(express.json());
app.use(logger);

// Task routes (cache middleware + event emissions live inside routes/tasks.js)
app.use('/tasks', taskRoutes);

// AI routes (Practical 13)
app.use('/api/ai', aiRoutes);

// health check - handy for Docker / CI
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler); // must be last

module.exports = app;
