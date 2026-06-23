import React from 'react';

export default function WelcomeModal({ title, message, onGotIt }) {
  return (
    <div className="welcome-modal-overlay">
      <div className="welcome-modal">
        <h2 className="font-pixel">{title}</h2>
        <div className="welcome-modal-body" dangerouslySetInnerHTML={{ __html: message }} />
        <button className="got-it-btn" onClick={onGotIt}>Got it!</button>
      </div>

      <style>{`
        .welcome-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }

        .welcome-modal {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          color: white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .welcome-modal h2 {
          margin: 0;
          color: #fbbf24;
          text-align: center;
          font-size: 1.4rem;
        }

        .welcome-modal-body {
          font-size: 0.95rem;
          color: #e2e8f0;
          line-height: 1.5;
        }
        
        .welcome-modal-body p {
          margin-top: 0;
          margin-bottom: 12px;
        }

        .welcome-modal-body strong {
          color: #8b5cf6;
        }

        .got-it-btn {
          width: 100%;
          padding: 12px;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 8px;
        }

        .got-it-btn:hover {
          background: #7c3aed;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes popIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
