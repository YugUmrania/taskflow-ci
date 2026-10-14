// Practical 10 - Asynchronous Processing with Event-Driven Architecture
// Uses Node.js' built-in `events` module - no external dependency.
const EventEmitter = require('events');

// A dedicated emitter class keeps the event bus explicit and extensible.
class TaskEvents extends EventEmitter {}

// One shared, process-wide instance:
//   routes  -> taskEvents.emit('task-created', task)
//   listeners -> taskEvents.on('task-created', handler)
module.exports = new TaskEvents();
