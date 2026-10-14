// Practical 10 - event listeners (background, non-blocking side effects).
//
// This file is required ONCE at start-up (see app.js) so that the handlers
// are registered before any route emits an event.
const taskEvents = require('./events');

const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// task-created
// ---------------------------------------------------------------------------
// The handler is async and deliberately slow (2s) to make the non-blocking
// behaviour obvious in the console: the HTTP response has already been sent
// before this handler finishes.
taskEvents.on('task-created', async (task) => {
  try {
    console.log(`[Notification] "task-created" received at ${now()}`);

    // Simulated slow work (e.g. sending an email / Slack notification).
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(
      `[Notification] Task "${task.title}" created at ${now()} | ` +
        `assigned user: ${task.assignedUser || 'Unassigned'}`
    );
    console.log(`[Notification] "task-created" handler finished at ${now()}`);
  } catch (err) {
    // A listener must never crash the process - surface it as a custom event.
    taskEvents.emit('task-error', { event: 'task-created', message: err.message });
  }
});

// ---------------------------------------------------------------------------
// task-deleted  (supplementary problem)
// ---------------------------------------------------------------------------
taskEvents.on('task-deleted', (task) => {
  console.log(
    `[Notification] Task "${task.title}" (id: ${task._id}) deleted at ${now()}`
  );
});

// ---------------------------------------------------------------------------
// task-error  (supplementary problem)
// ---------------------------------------------------------------------------
// NOTE: 'error' is a reserved EventEmitter event name - if emitted without a
// listener it throws. We use the custom name 'task-error' to stay safe.
taskEvents.on('task-error', (info) => {
  console.error(`[Notification] Error while handling "${info.event}": ${info.message}`);
});

module.exports = taskEvents;
