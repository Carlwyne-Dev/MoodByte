import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AudioProvider } from './context/AudioContext.jsx'
import AdminDashboard from './components/admin/AdminDashboard.jsx'

const isAdmin = window.location.pathname === '/admin';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? (
      <AdminDashboard />
    ) : (
      <ThemeProvider>
        <AudioProvider>
          <App />
        </AudioProvider>
      </ThemeProvider>
    )}
  </React.StrictMode>,
)
