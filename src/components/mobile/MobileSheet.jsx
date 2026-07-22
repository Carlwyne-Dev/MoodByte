import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Reusable mobile bottom sheet.
 * Slides up from above the nav bar, backdrop dims the rest.
 */
export default function MobileSheet({ title, onClose, children, maxHeight = '82vh' }) {
  // Prevent body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div className="mob-sheet-backdrop" onClick={onClose}>
      <div
        className="mob-sheet"
        style={{ maxHeight }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="mob-sheet-handle-row">
          <div className="mob-sheet-handle" />
        </div>

        {/* Header */}
        <div className="mob-sheet-header">
          <span className="mob-sheet-title font-pixel">{title}</span>
          <button className="mob-sheet-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="mob-sheet-body">
          {children}
        </div>
      </div>

      <style>{`
        .mob-sheet-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99000;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-end;
          animation: sheetFadeIn 0.2s ease;
        }
        @keyframes sheetFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .mob-sheet {
          width: 100%;
          background: rgba(10, 14, 30, 0.96);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255,255,255,0.1);
          border-bottom: none;
          border-radius: 24px 24px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: sheetSlideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 -12px 48px rgba(0,0,0,0.5);
        }
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .mob-sheet-handle-row {
          display: flex; justify-content: center;
          padding: 10px 0 4px;
          flex-shrink: 0;
        }
        .mob-sheet-handle {
          width: 36px; height: 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
        }

        .mob-sheet-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 4px 20px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .mob-sheet-title {
          font-size: 0.6rem;
          color: var(--primary, #a855f7);
          letter-spacing: 0.08em;
        }
        .mob-sheet-close {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .mob-sheet-close:active { background: rgba(255,255,255,0.15); }

        .mob-sheet-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 16px 0 calc(16px + env(safe-area-inset-bottom, 0px));
        }

        /* Suppress the desktop modal's own full-screen overlay when inside a sheet */
        .mob-sheet-body .stats-overlay,
        .mob-sheet-body .settings-overlay,
        .mob-sheet-body .about-overlay {
          position: static !important;
          background: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          display: block !important;
          animation: none !important;
        }
        .mob-sheet-body .stats-modal,
        .mob-sheet-body .settings-modal {
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
          max-height: none !important;
          max-width: 100% !important;
          width: 100% !important;
          border-radius: 0 !important;
          padding: 0 20px !important;
          animation: none !important;
        }
      `}</style>
    </div>,
    document.body
  );
}
