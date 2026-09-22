import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SyncToast() {
  const [message, setMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let queuedMsg = null;
    let timer = null;
    let exitTimer = null;

    const displayMessage = (detail) => {
      const isObject = detail && typeof detail === 'object';
      setMessage(isObject ? detail.message : detail);
      setToastType(isObject && detail.type === 'error' ? 'error' : 'success');
      setIsExiting(false);
      if (timer) clearTimeout(timer);
      if (exitTimer) clearTimeout(exitTimer);

      timer = setTimeout(() => {
        setIsExiting(true);
        exitTimer = setTimeout(() => {
          setMessage(null);
          setIsExiting(false);
        }, 300); // Wait for exit animation to finish
      }, 3500); // Display for 3.5 seconds
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
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, []);

  if (!message && !isExiting) return null;

  return createPortal(
    <div className={`sync-toast-container ${isExiting ? 'exiting' : ''}`}>
      <div className={`sync-toast-content ${toastType === 'error' ? 'error' : ''}`}>
        {toastType === 'error'
          ? <AlertTriangle size={18} className="sync-toast-icon" />
          : <CheckCircle2 size={18} className="sync-toast-icon" />}
        <span className="sync-toast-text">{message}</span>
      </div>

      <style jsx="true">{`
        .sync-toast-container {
          position: fixed;
          top: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          animation: slideDownFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .sync-toast-container.exiting {
          animation: slideUpFadeOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .sync-toast-content {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(34, 197, 94, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 100px;
          padding: 10px 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .sync-toast-content.error {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .sync-toast-icon {
          color: #22c55e;
        }

        .sync-toast-content.error .sync-toast-icon {
          color: #ef4444;
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

        @keyframes slideUpFadeOut {
          from {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -20px) scale(0.9);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
