// frontend/src/config.js
export const config = {
  API_BASE: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  APP_MODE: import.meta.env.VITE_APP_MODE || 'development',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
};

// Use in your components
import { config } from '../config';
const { API_BASE } = config;