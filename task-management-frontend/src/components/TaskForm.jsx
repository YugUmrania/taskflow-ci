import { useEffect, useState } from 'react';
import { generateDescription } from '../api.js';

// Practical 13 - TaskForm now includes an AI "Generate description" button.
// The suggestion is shown as an editable draft the user can accept or ignore.
function TaskForm({ editingTask, isSaving, onSubmit, onCancelEdit, onActivity }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiFallback, setAiFallback] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
    setFormError(null);
    setAiSuggestion('');
    setAiNotice(null);
    setAiFallback(false);
  }, [editingTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Title is required.');
      return;
    }
    setFormError(null);
    onSubmit({
      title: trimmedTitle,
      description: description.trim() || undefined,
    });
    setAiSuggestion('');
    setAiNotice(null);
  };

  const handleGenerate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Enter a title first, then generate a description.');
      return;
    }
    setFormError(null);
    setAiLoading(true);
    setAiNotice(null);
    try {
      const data = await generateDescription(trimmedTitle, { onActivity });
      setAiSuggestion(data.description || '');
      setAiFallback(Boolean(data.fallback));
      setAiNotice(data.message || null);
    } catch (err) {
      setAiFallback(true);
      setAiNotice(`AI suggestion failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = () => {
    setDescription(aiSuggestion);
    setAiSuggestion('');
    setAiNotice(null);
  };

  const dismissSuggestion = () => {
    setAiSuggestion('');
    setAiNotice(null);
    setAiFallback(false);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <div className="form-header">
        <h2>{editingTask ? 'Edit Task' : 'New Task'}</h2>
        {editingTask && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancelEdit}
            disabled={isSaving}
          >
            Cancel edit
          </button>
        )}
      </div>

      {formError && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">!</span>
          <span>{formError}</span>
          <button className="alert-close" onClick={() => setFormError(null)}>
            ×
          </button>
        </div>
      )}

      <div className="form-row">
        <div className="field field-title">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="field field-desc">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            placeholder="Add a short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : editingTask ? 'Save changes' : 'Add task'}
        </button>
      </div>

      {/* ---------- Practical 13: AI helper ---------- */}
      <div className="ai-bar">
        <button
          type="button"
          className="btn btn-ai btn-xs"
          onClick={handleGenerate}
          disabled={aiLoading || isSaving}
        >
          {aiLoading ? '✨ Generating…' : '✨ Generate description with AI'}
        </button>
        <span className="ai-hint">
          Calls <code>/api/ai/generate-description</code> on the backend (API key stays server-side).
        </span>
      </div>

      {(aiSuggestion || aiNotice) && (
        <div className="ai-suggestion">
          <div className="ai-suggestion-head">
            <span className="ai-suggestion-title">
              ✨ AI Suggestion
              <span className="ai-badge">{aiFallback ? 'Fallback' : 'AI-generated'}</span>
            </span>
            <div className="ai-actions">
              {aiSuggestion && (
                <button type="button" className="btn btn-ai btn-xs" onClick={applySuggestion}>
                  Use this description
                </button>
              )}
              <button type="button" className="btn btn-ghost btn-xs" onClick={dismissSuggestion}>
                Dismiss
              </button>
            </div>
          </div>

          {aiSuggestion && (
            <textarea
              rows="3"
              value={aiSuggestion}
              onChange={(e) => setAiSuggestion(e.target.value)}
              aria-label="AI suggested description"
            />
          )}

          {aiNotice && <p className="ai-disclaimer">{aiNotice}</p>}

          <p className="ai-disclaimer">
            ⚠ This description is AI-generated and should be reviewed before you save it.
          </p>
        </div>
      )}
    </form>
  );
}

export default TaskForm;
