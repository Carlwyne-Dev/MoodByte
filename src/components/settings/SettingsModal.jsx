import React from 'react';
import { createPortal } from 'react-dom';
import { X, Settings as SettingsIcon, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const THEMES = [
  { id: 'night', label: 'Night' },
  { id: 'rainy', label: 'Rainy' },
  { id: 'chill', label: 'Chill' },
  { id: 'productive', label: 'Focus' },
];

export default function SettingsModal({ onClose }) {
  const { theme, customBgs, uploadCustomBgForTheme, clearCustomBgForTheme } = useTheme();

  const handleUploadBg = async (e, themeId) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadCustomBgForTheme(themeId, file);
      e.target.value = null; // reset input
    }
  };

  return createPortal(
    <div className="settings-overlay fade-in" onClick={onClose}>
      <div className="settings-modal pop-in" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="header-title">
            <SettingsIcon size={24} className="header-icon" />
            <h2>Settings</h2>
          </div>
          <button className="settings-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3 className="section-title">
              <ImageIcon size={18} /> Custom Theme Wallpapers
            </h3>
            <p className="section-desc">
              Upload custom backgrounds up to 5MB. They will be saved and used whenever you switch to that theme!
            </p>

            <div className="theme-bg-list">
              {THEMES.map(t => {
                const hasCustomBg = !!customBgs[t.id];
                return (
                  <div key={t.id} className="theme-bg-item">
                    <span className="theme-name">{t.label} Theme</span>
                    <div className="theme-bg-actions">
                      {hasCustomBg && (
                        <button 
                          className="remove-bg-btn" 
                          onClick={() => clearCustomBgForTheme(t.id)}
                          title="Remove custom wallpaper"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <label className="upload-bg-btn">
                        {hasCustomBg ? 'Change Wallpaper' : 'Upload Wallpaper'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={(e) => handleUploadBg(e, t.id)} 
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .settings-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
        }
        .settings-modal {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          width: 500px;
          max-width: 90vw;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .settings-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.2);
        }
        .header-title {
          display: flex; align-items: center; gap: 12px;
        }
        .header-title h2 {
          margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.5rem; color: #fff;
        }
        .header-icon {
          color: #94a3b8;
        }
        .settings-close-btn {
          background: none; border: none; color: #94a3b8; cursor: pointer;
          border-radius: 8px; padding: 6px; transition: all 0.2s;
        }
        .settings-close-btn:hover {
          color: #ef4444; background: rgba(239, 68, 68, 0.1);
        }

        .settings-content {
          padding: 24px;
        }
        .settings-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 20px;
        }
        .section-title {
          display: flex; align-items: center; gap: 8px;
          margin: 0 0 8px 0; color: #e2e8f0; font-size: 1.1rem;
        }
        .section-desc {
          margin: 0 0 20px 0; color: #94a3b8; font-size: 0.9rem; line-height: 1.4;
        }

        .theme-bg-list {
          display: flex; flex-direction: column; gap: 12px;
        }
        .theme-bg-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .theme-name {
          color: #e2e8f0; font-weight: 500;
        }
        .theme-bg-actions {
          display: flex; align-items: center; gap: 8px;
        }
        .upload-bg-btn {
          background: var(--primary);
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .upload-bg-btn:hover {
          transform: translateY(-1px);
        }
        .remove-bg-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .remove-bg-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .pop-in { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
