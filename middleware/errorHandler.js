function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // Malformed JSON body (from express.json parsing)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  // Invalid MongoDB ObjectId anywhere (defensive, routes already guard for it)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid resource id' });
  }

  // Validation errors should be 400, not 500
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.message });
  }

  res
    .status(err.status || 500)
    .json({ error: 'Internal Server Error', message: err.message || 'Something went wrong' });
}

module.exports = errorHandler;