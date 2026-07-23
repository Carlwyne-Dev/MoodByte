import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, CheckCircle2 } from 'lucide-react';

export default function SyncToast() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let queuedMsg = null;
    let timer = null;

    const displayMessage = (msg) => {
      setMessage(msg);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setMessage(null);
      }, 4000);
    };

    const handleToast = (e) => {
      // If loading screen is currently showing, queue it
      if (document.querySelector('.loading-screen')) {
        queuedMsg = e.detail;
      } else {
        displayMessage(e.detail);
      }
    };

    const handleAppReady = () => {
      if (queuedMsg) {
        displayMessage(queuedMsg);
        queuedMsg = null;
      }
    };

    window.addEventListener('sync-toast', handleToast);
    window.addEventListener('app-ready', handleAppReady);
    
    return () => {
      window.removeEventListener('sync-toast', handleToast);
      window.removeEventListener('app-ready', handleAppReady);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!message) return null;

  return createPortal(
    <div className="sync-toast-container pop-in">
      <div className="sync-toast-content">
        <CheckCircle2 size={18} className="sync-toast-icon" />
        <span className="sync-toast-text">{message}</span>
      </div>

      <style jsx="true">{`
        .sync-toast-container {
          position: fixed;
          top: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          animation: slideDownFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .sync-toast-content {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(34, 197, 94, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 100px;
          padding: 10px 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .sync-toast-icon {
          color: #22c55e;
        }
        
        .sync-toast-text {
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
        }

        @keyframes slideDownFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
