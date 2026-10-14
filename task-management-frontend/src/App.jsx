import { useCallback, useEffect, useRef, useState } from 'react';
import {
  API_BASE,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  pingBackend,
} from './api.js';
import TaskForm from './components/TaskForm.jsx';
import TaskCard from './components/TaskCard.jsx';
import ActivityLog from './components/ActivityLog.jsx';

function App() {
  const [tasks, setTasks] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [pendingId, setPendingId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const [activity, setActivity] = useState([]);
  const idCounter = useRef(0);

  const [online, setOnline] = useState(false);

  const logActivity = useCallback(({ method, path, status, ok }) => {
    idCounter.current += 1;
    setActivity((prev) =>
      [
        {
          id: `${Date.now()}-${idCounter.current}`,
          method,
          path,
          status,
          ok,
          at: Date.now(),
        },
        ...prev,
      ].slice(0, 25)
    );
  }, []);

  const loadTasks = useCallback(
    async (options = {}) => {
      const { silent = false } = options;
      if (!silent) {
        setInitialLoading(true);
        setInitialError(null);
      }
      try {
        const data = await getTasks({ onActivity: logActivity });
        setTasks(data);
        setInitialError(null);
      } catch (err) {
        if (!silent) setInitialError(err.message);
        else setActionError(err.message);
      } finally {
        setInitialLoading(false);
      }
    },
    [logActivity]
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Backend status pill
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        await pingBackend();
        if (active) setOnline(true);
      } catch {
        if (active) setOnline(false);
      }
    };
    check();
    const id = setInterval(check, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const handleCreate = async (payload) => {
    setActionError(null);
    setPendingId('creating');
    try {
      const newTask = await createTask(payload, { onActivity: logActivity });
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) {
      setActionError(`Could not create task: ${err.message}`);
    } finally {
      setPendingId(null);
    }
  };

  const handleToggle = async (task) => {
    setActionError(null);
    setPendingId(task._id);
    try {
      const updated = await updateTask(
        task._id,
        { completed: !task.completed },
        { onActivity: logActivity }
      );
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } catch (err) {
      setActionError(`Could not update task: ${err.message}`);
    } finally {
      setPendingId(null);
    }
  };

  const handleUpdate = async (id, updates) => {
    setActionError(null);
    setPendingId(id);
    try {
      const updated = await updateTask(id, updates, { onActivity: logActivity });
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      setEditingTask(null);
    } catch (err) {
      setActionError(`Could not update task: ${err.message}`);
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id) => {
    setActionError(null);
    setPendingId(id);
    try {
      await deleteTask(id, { onActivity: logActivity });
      setTasks((prev) => prev.filter((t) => t._id !== id));
      if (editingTask?._id === id) setEditingTask(null);
    } catch (err) {
      setActionError(`Could not delete task: ${err.message}`);
    } finally {
      setPendingId(null);
    }
  };

  const openEdit = (task) => {
    setActionError(null);
    setEditingTask(task);
  };

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="app">
      <div className="app-inner">
        <header className="header">
          <div className="header-brand">
            <div className="header-icon">✓</div>
            <div className="header-text">
              <h1>TaskFlow</h1>
              <p className="subtitle">
                React + Express task manager · caching · event-driven · AI assistant
              </p>
            </div>
          </div>

          <div className="header-tools">
            <div className="header-stats">
              <div className="stat-pill">
                <b>{tasks.length}</b>
                <span>total</span>
              </div>
              <div className="stat-pill stat-pill-green">
                <b>{doneCount}</b>
                <span>done</span>
              </div>
            </div>

            <div className="status-pill" title={API_BASE}>
              <span className={`status-dot ${online ? 'is-online' : ''}`} />
              {online ? 'Backend online' : 'Backend offline'}
            </div>
          </div>
        </header>

        <main className="layout">
          <div className="layout-main">
            <TaskForm
              key={editingTask ? editingTask._id : 'new'}
              editingTask={editingTask}
              isSaving={pendingId === (editingTask ? editingTask._id : 'creating')}
              onSubmit={editingTask ? (payload) => handleUpdate(editingTask._id, payload) : handleCreate}
              onCancelEdit={() => setEditingTask(null)}
              onActivity={logActivity}
            />

            {actionError && (
              <>
                <div className="alert-spacer" />
                <div className="alert alert-error" role="alert">
                  <span className="alert-icon">!</span>
                  <span>{actionError}</span>
                  <button className="alert-close" onClick={() => setActionError(null)}>
                    ×
                  </button>
                </div>
              </>
            )}

            <section className="tasks-section">
              <div className="section-head">
                <h2>Your Tasks</h2>
                {!initialLoading && !initialError && tasks.length > 0 && (
                  <span className="section-note">
                    {doneCount}/{tasks.length} completed
                  </span>
                )}
              </div>

              {initialLoading && (
                <div className="state-block" role="status">
                  <div className="spinner" />
                  <p>Loading tasks…</p>
                </div>
              )}

              {!initialLoading && initialError && (
                <div className="state-block state-error" role="alert">
                  <p>❌ Failed to load tasks: {initialError}</p>
                  <button className="btn btn-primary" onClick={() => loadTasks()}>
                    Retry
                  </button>
                </div>
              )}

              {!initialLoading && !initialError && tasks.length === 0 && (
                <div className="state-block" role="status">
                  <p>📋 No tasks yet. Create your first task above!</p>
                </div>
              )}

              {!initialLoading && !initialError && tasks.length > 0 && (
                <ul className="task-list">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      isPending={pendingId === task._id}
                      onToggle={handleToggle}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      isEditing={editingTask?._id === task._id}
                    />
                  ))}
                </ul>
              )}
            </section>

            <footer className="footer">
              Data served by the Express API at <code>{API_BASE}</code> · GET /tasks is cached
              for 60s · new tasks fire a background notification event.
            </footer>
          </div>

          <aside className="layout-side">
            <ActivityLog entries={activity} onClear={() => setActivity([])} />
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;
