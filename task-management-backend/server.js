require('dotenv').config();
const app = require('./app');
const connectDB = require('./config');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB first, then start accepting requests.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
