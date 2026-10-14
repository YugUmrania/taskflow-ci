const NodeCache = require('node-cache');

const taskCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const CACHE_KEY_ALL_TASKS = 'all_tasks';

function cacheMiddleware(req, res, next) {
  if (req.method !== 'GET') {
    return next();
  }

  const cachedData = taskCache.get(CACHE_KEY_ALL_TASKS);
  if (cachedData) {
    console.log('[CACHE HIT] Serving from cache');
    return res.json(cachedData);
  }

  console.log('[CACHE MISS] Fetching from database');
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    taskCache.set(CACHE_KEY_ALL_TASKS, data);
    console.log('[CACHE SET] Stored in cache');
    return originalJson(data);
  };
  next();
}

function invalidateCache() {
  taskCache.del(CACHE_KEY_ALL_TASKS);
  console.log('[CACHE INVALIDATED] All tasks cache cleared');
}

function getCacheStats() {
  return {
    keys: taskCache.keys().length,
    stats: taskCache.getStats(),
  };
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  getCacheStats,
  taskCache,
};