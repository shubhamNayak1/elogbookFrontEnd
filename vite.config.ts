
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: "/elogbookFrontEnd/",
  plugins: [react()],
  define: {
    // Ensuring process.env is defined for the browser-side Gemini SDK
    'process.env': process.env
  },
  server: {
    port: 3000,
    open: true
  }
});
