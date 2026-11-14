import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from './lib/router';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </StrictMode>,
);
