import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AudioProvider } from './context/AudioContext.jsx'

// Regular visitors never hit /admin, so keep it out of their bundle entirely.
// eslint-disable-next-line react-refresh/only-export-components
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard.jsx'))

const isAdmin = window.location.pathname === '/admin';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <AdminDashboard />
      </Suspense>
    ) : (
      <ThemeProvider>
        <AudioProvider>
          <App />
        </AudioProvider>
      </ThemeProvider>
    )}
  </React.StrictMode>,
)
