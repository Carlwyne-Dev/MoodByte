import React from 'react';
import { X } from 'lucide-react';

/**
 * Floating glass tray that appears just above the bottom nav bar.
 * Used for Tasks and Calendar tabs.
 */
export default function MobileFloatingTray({ title, onClose, children, heightVh = 52 }) {
  return (
    <>
      {/* Tap-outside backdrop */}
      <div
        className="mft-backdrop"
        onPointerDown={onClose}
        style={{ touchAction: 'none' }}
      />

      <div className="mft-tray" style={{ maxHeight: `${heightVh}vh` }}>
        {/* Header */}
        <div className="mft-header">
          <span className="mft-title font-pixel">{title}</span>
          <button className="mft-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Scrollable body */}
        <div className="mft-body">
          {children}
        </div>
      </div>

      <style>{`
        .mft-backdrop {
          position: fixed; inset: 0;
          z-index: 8100;
        }

        .mft-tray {
          position: fixed;
          bottom: calc(84px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 480px;
          background: rgba(10, 14, 30, 0.94);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 22px;
          box-shadow: 0 10px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07);
          z-index: 8200;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: mftSlideUp 0.24s cubic-bezier(0.34, 1.3, 0.64, 1);
        }
        @keyframes mftSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        .mft-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .mft-title {
          font-size: 0.6rem;
          color: var(--primary, #a855f7);
          letter-spacing: 0.08em;
        }
        .mft-close {
          width: 26px; height: 26px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .mft-close:active { background: rgba(255,255,255,0.15); }

        .mft-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 10px 12px;
        }

        /* ── Compact task overrides inside the mobile tray ── */
        .mft-body .task-container {
          gap: 0.5rem;
        }
        .mft-body .task-header {
          gap: 0.3rem;
        }
        .mft-body .task-stat-label {
          font-size: 0.72rem;
        }
        .mft-body .task-input-form {
          padding: 4px 4px 4px 10px;
          border-radius: 10px;
        }
        .mft-body .task-input {
          font-size: 0.8rem;
        }
        .mft-body .filter-tabs {
          gap: 0.3rem;
        }
        .mft-body .filter-tab {
          padding: 0.2rem 0.4rem;
          font-size: 0.67rem;
          border-radius: 7px;
        }
        .mft-body .task-list {
          max-height: none;
        }
        .mft-body .task-item {
          padding: 0.45rem 0.65rem;
          margin-bottom: 0.3rem;
          border-radius: 10px;
          gap: 0.55rem;
        }
        .mft-body .checkbox {
          width: 18px;
          height: 18px;
          border-radius: 5px;
        }
        .mft-body .task-name {
          font-size: 0.8rem;
        }
        .mft-body .task-date {
          font-size: 0.65rem;
        }
        .mft-body .clear-done-btn {
          font-size: 0.72rem;
          padding: 6px 0;
        }
      `}</style>
    </>
  );
}
