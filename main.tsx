// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

// This line gets your Client ID from the .env file
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// This is a safety check. If the Client ID is missing, it will give a clear error.
if (!googleClientId) {
  throw new Error("VITE_GOOGLE_CLIENT_ID is not defined. Please check your .env file and Vercel settings.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* This provider gives your entire App access to Google Authentication */}
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);