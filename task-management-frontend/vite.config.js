import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No proxy: the React app calls the Express API directly at http://localhost:3000
// (CORS is enabled on the backend). Override with VITE_API_URL if needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // Practical 11 - the container serves the production build on port 5173.
  preview: {
    port: 5173,
    host: true,
  },
});
