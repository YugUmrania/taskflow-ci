import { useEffect, useState } from 'react';

function timeAgo(ts, now) {
  const diff = Math.max(0, Math.floor((now - ts) / 1000));
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function ActivityLog({ entries, onClear }) {
  // entries: { id, method, path, status, ok, at }
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!entries.length) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [entries.length]);

  return (
    <section className="log-panel">
      <div className="log-header">
        <div>
          <h2>Activity Log</h2>
          <p className="log-subtitle">Live API requests to the backend</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={onClear}
          disabled={!entries.length}
        >
          Clear
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="log-empty">
          <span className="log-empty-dot" />
          No requests yet — create, edit, or delete a task to watch the API calls land here.
        </div>
      ) : (
        <ul className="log-list">
          {entries.map((e) => (
            <li key={e.id} className={`log-entry ${e.ok ? '' : 'log-entry-error'}`}>
              <span className={`method-badge method-${e.method.toLowerCase()}`}>{e.method}</span>
              <div className="log-info">
                <span className={`log-status ${e.ok ? 'is-ok' : 'is-error'}`}>
                  {e.ok ? e.status : 'FAILED'}
                </span>
                <code className="log-path">{e.path}</code>
              </div>
              <span className="log-time">{timeAgo(e.at, now)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ActivityLog;
