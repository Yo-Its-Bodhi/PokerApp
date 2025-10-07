import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('[main.tsx] Starting application...');

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('[main.tsx] App rendered successfully');
} catch (error) {
  console.error('[main.tsx] Failed to render app:', error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;">Error loading app: ${error}</div>`;
}