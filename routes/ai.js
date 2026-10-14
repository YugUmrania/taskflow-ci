// Practical 13 - AI API Integration (server-side only).
//
// The frontend never sees the API key: it calls THIS endpoint, and this
// endpoint calls the AI provider using a key stored in backend/.env.
const express = require('express');
const router = express.Router();

// ---------------------------------------------------------------------------
// Simple in-memory rate limit: 1 AI request per title per minute.
// (A real deployment would use a shared store such as Redis.)
// ---------------------------------------------------------------------------
const WINDOW_MS = 60 * 1000;
const recentRequests = new Map();

function rateLimit(req, res, next) {
  const key = String(req.body?.title || req.ip || 'anonymous').trim().toLowerCase();
  const at = Date.now();
  const last = recentRequests.get(key);

  if (last && at - last < WINDOW_MS) {
    const wait = Math.ceil((WINDOW_MS - (at - last)) / 1000);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Please wait ${wait}s before requesting another AI suggestion.`,
    });
  }

  recentRequests.set(key, at);
  next();
}

// Graceful degradation: an offline, deterministic suggestion so that the
// core task-creation flow keeps working even if the AI provider is down.
function fallbackDescription(title) {
  const clean = String(title || 'this task').trim();
  return `Complete "${clean}" - break it into small steps, set a due date, and update progress as you go.`;
}

// POST /api/ai/generate-description  { title } -> { description, source }
router.post('/generate-description', rateLimit, async (req, res) => {
  const title = String(req.body?.title || '').trim();

  if (!title) {
    return res.status(400).json({ error: 'A task title is required.' });
  }

  // No key configured -> return the fallback instead of crashing.
  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      description: fallbackDescription(title),
      source: 'fallback',
      fallback: true,
      message:
        'AI is not configured (OPENAI_API_KEY missing) - showing an offline suggestion.',
    });
  }

  try {
    // Required lazily so the rest of the API runs even without the SDK.
    const OpenAI = require('openai');
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15000,
    });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You write concise, practical task descriptions in at most 2 sentences.',
        },
        {
          role: 'user',
          content: `Write a short task description for the task titled: "${title}"`,
        },
      ],
    });

    const description =
      completion?.choices?.[0]?.message?.content?.trim() || fallbackDescription(title);

    return res.status(200).json({ description, source: 'openai', fallback: false });
  } catch (err) {
    // Any failure (bad key, quota, timeout) must not break the app.
    console.error('[AI] description generation failed:', err.message);
    return res.status(200).json({
      description: fallbackDescription(title),
      source: 'fallback',
      fallback: true,
      message: 'AI suggestion unavailable right now - showing an offline suggestion.',
    });
  }
});

module.exports = router;
