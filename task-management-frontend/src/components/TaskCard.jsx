function TaskCard({ task, isPending, onToggle, onEdit, onDelete, isEditing }) {
  const createdAt = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <li className={`task-card ${isPending ? 'is-pending' : ''}`}>
      <button
        className={`task-check ${task.completed ? 'is-checked' : ''}`}
        onClick={() => onToggle(task)}
        disabled={isPending}
        title={task.completed ? 'Mark as not done' : 'Mark as done'}
        aria-label="Toggle task completed"
      >
        {task.completed && <span className="checkmark">✔</span>}
      </button>

      <div className="task-body">
        <p className={`task-title ${task.completed ? 'is-done' : ''}`}>{task.title}</p>
        {task.description && (
          <p className={`task-desc ${task.completed ? 'is-done' : ''}`}>{task.description}</p>
        )}
        {createdAt && <p className="task-date">Added {createdAt}</p>}
      </div>

      {isPending && <div className="task-spinner" aria-label="Updating…" title="Working…" />}

      {!isPending && (
        <div className="task-actions">
          <button
            className="btn btn-xs btn-edit"
            onClick={() => onEdit(task)}
            disabled={isEditing}
            title="Edit task"
          >
            ✏️ Edit
          </button>
          <button
            className="btn btn-xs btn-danger"
            onClick={() => onDelete(task._id)}
            title="Delete task"
          >
            🗑 Delete
          </button>
        </div>
      )}
    </li>
  );
}

export default TaskCard;
