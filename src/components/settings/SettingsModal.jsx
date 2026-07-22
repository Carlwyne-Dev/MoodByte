import React from 'react';
import { createPortal } from 'react-dom';
import { X, Settings as SettingsIcon, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getImageBlob } from '../../hooks/useImageStorage';

const THEMES = [
  { id: 'night', label: 'Night' },
  { id: 'rainy', label: 'Rainy' },
  { id: 'chill', label: 'Chill' },
  { id: 'productive', label: 'Focus' },
];

export default function SettingsModal({ onClose }) {
  const { theme, customBgs, uploadCustomBgForTheme, removeCustomBg } = useTheme();
  const [previewUrls, setPreviewUrls] = React.useState({});

  React.useEffect(() => {
    let active = true;
    const newUrls = {};

    const loadPreviews = async () => {
      for (const t of THEMES) {
        const list = customBgs[t.id] || [];
        for (const bgId of list) {
          const blob = await getImageBlob(bgId);
          if (blob && active) {
            newUrls[bgId] = URL.createObjectURL(blob);
          }
        }
      }
      if (active) setPreviewUrls(newUrls);
    };

    loadPreviews();

    return () => {
      active = false;
      Object.values(newUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [customBgs]);

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

            <div className="theme-bg-grid">
              {THEMES.map(t => {
                const bgList = customBgs[t.id] || [];
                const bgCount = bgList.length;
                
                return (
                  <div key={t.id} className="theme-bg-item">
                    <div className="theme-bg-info">
                      <span className="theme-name">{t.label} Theme</span>
                      <span className="theme-count">{bgCount}/3</span>
                    </div>
                    <div className="theme-slots">
                      {[0, 1, 2].map(index => {
                        const bgId = bgList[index];
                        const previewUrl = bgId ? previewUrls[bgId] : null;
                        
                        return (
                          <div key={index} className="theme-slot">
                            {bgId && previewUrl ? (
                              <>
                                <img src={previewUrl} alt="Wallpaper" className="theme-slot-img" />
                                <div className="theme-slot-overlay">
                                  <button 
                                    className="remove-slot-btn" 
                                    onClick={() => removeCustomBg(t.id, bgId)}
                                    title="Remove this wallpaper"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <label className="theme-slot-empty" title="Upload Wallpaper">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  style={{ display: 'none' }} 
                                  onChange={(e) => handleUploadBg(e, t.id)} 
                                />
                                <span className="plus-icon">+</span>
                              </label>
                            )}
                          </div>
                        );
                      })}
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

        .theme-bg-grid {
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 16px;
        }
        .theme-bg-item {
          display: flex; flex-direction: column;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .theme-bg-info {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .theme-name {
          color: #e2e8f0; font-weight: 600; font-size: 0.95rem;
        }
        .theme-count {
          color: #94a3b8; font-size: 0.8rem; font-family: 'Outfit', sans-serif;
          background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 12px;
        }
        
        .theme-slots {
          display: flex;
          padding: 12px;
          gap: 8px;
          justify-content: space-between;
        }
        
        .theme-slot {
          flex: 1;
          aspect-ratio: 16/10;
          background: rgba(0,0,0,0.4);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          border: 1px dashed rgba(255,255,255,0.1);
        }
        
        .theme-slot-img {
          width: 100%; height: 100%; object-fit: cover;
        }
        
        .theme-slot-empty {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .theme-slot-empty:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.5);
        }
        .plus-icon {
          color: #64748b; font-size: 1.5rem; font-weight: 300;
        }
        .theme-slot-empty:hover .plus-icon {
          color: #8b5cf6;
        }
        
        .theme-slot-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .theme-slot:hover .theme-slot-overlay {
          opacity: 1;
        }
        
        .remove-slot-btn {
          background: rgba(239, 68, 68, 0.9);
          color: #fff; border: none;
          padding: 6px; border-radius: 6px;
          cursor: pointer; transition: background 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .remove-slot-btn:hover {
          background: #dc2626;
        }

        .fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .pop-in { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @media (max-width: 768px) {
          .settings-overlay {
            align-items: flex-end;
            padding-bottom: 0;
          }
          .settings-modal {
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 24px 24px 0 0;
            max-height: 88dvh;
            overflow-y: auto;
          }
          .theme-wallpapers-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .settings-header {
            padding: 16px 18px;
          }
          .settings-body {
            padding: 16px 18px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
